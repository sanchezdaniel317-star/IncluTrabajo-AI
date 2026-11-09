import { useState } from "react";
import { data, Form, useNavigation } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/perfil";
import { db } from "~/.server/db";
import { cargarPersona, catalogos } from "~/.server/datos";
import { conAviso, requerirUsuario } from "~/.server/sesion";
import { exigirMismoOrigen } from "~/.server/seguridad";
import { cop, DOMINIOS, fecha, JORNADAS_PREF, MODALIDADES_PREF, NIVELES_DIFICULTAD, PRIORIDADES } from "~/lib/catalogo";
import { PARAMETROS_2026 } from "~/lib/cumplimiento";
import { Icono } from "~/components/Icono";
import { BotonDictar, Campo, ErroresFormulario } from "~/components/ui";

export const meta: Route.MetaFunction = () => [{ title: "Mi perfil — IncluTrabajo IA" }];

export async function loader({ request }: Route.LoaderArgs) {
  const u = await requerirUsuario(request, "persona");
  const [persona, cat, extra] = await Promise.all([
    cargarPersona(u.id),
    catalogos(),
    (await db()).query<{ comparte_desde: string | null }>("select comparte_desde::text from personas where usuario_id = $1", [u.id]),
  ]);
  if (!persona) throw new Response("Perfil no encontrado", { status: 404 });
  return { persona, ...cat, comparteDesde: extra[0]?.comparte_desde ?? null };
}

const esquema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre completo.").max(150),
  ciudad: z.string().trim().min(2, "Escribe tu ciudad.").max(100),
  telefono: z.string().trim().max(30).optional(),
  experiencia_anios: z.coerce.number({ message: "Escribe tus años de experiencia en números." }).int().min(0, "No puede ser negativo.").max(70, "Revisa los años de experiencia."),
  modalidad_pref: z.enum(["presencial", "hibrido", "remoto", "cualquiera"]),
  jornada_pref: z.enum(["completa", "medio_tiempo", "cualquiera"]),
  salario_min: z.coerce.number({ message: "Escribe el salario en números, sin puntos." }).int().min(0).max(100_000_000, "Revisa el salario."),
});

export async function action({ request }: Route.ActionArgs) {
  exigirMismoOrigen(request);
  const u = await requerirUsuario(request, "persona");
  const form = await request.formData();
  const r = esquema.safeParse({
    nombre: form.get("nombre"),
    ciudad: form.get("ciudad"),
    telefono: form.get("telefono") || undefined,
    experiencia_anios: form.get("experiencia_anios") || 0,
    modalidad_pref: form.get("modalidad_pref"),
    jornada_pref: form.get("jornada_pref"),
    salario_min: String(form.get("salario_min") ?? "0").replace(/[.\s$]/g, "") || 0,
  });
  if (!r.success) {
    const errores: Record<string, string> = {};
    for (const i of r.error.issues) errores[String(i.path[0])] ??= i.message;
    return data({ errores }, { status: 400 });
  }
  const { ajustes, competencias } = await catalogos();
  const idsComp = new Set(competencias.map((c) => c.id));
  const elegidas = form.getAll("competencias").map(Number).filter((id) => idsComp.has(id));
  const ajustesElegidos: [number, number][] = [];
  for (const a of ajustes) {
    const p = Number(form.get(`ajuste_${a.id}`));
    if (p >= 1 && p <= 3) ajustesElegidos.push([a.id, p]);
  }
  const dominios: Record<string, number> = {};
  for (const d of DOMINIOS) {
    const v = Number(form.get(`dominio_${d.clave}`));
    if (v >= 1 && v <= 4) dominios[d.clave] = v;
  }
  const comparte = form.get("comparte") === "si";
  const d = r.data;
  await (await db()).tx(async (t) => {
    await t.query("update usuarios set nombre = $1 where id = $2", [d.nombre, u.id]);
    await t.query(
      `update personas set ciudad = $1, telefono = $2, experiencia_anios = $3, modalidad_pref = $4, jornada_pref = $5, salario_min = $6,
              dominios = $7::jsonb, comparte_ajustes = $8,
              comparte_desde = case when $8 and not comparte_ajustes then now() when not $8 then null else comparte_desde end
        where usuario_id = $9`,
      [d.ciudad, d.telefono ?? null, d.experiencia_anios, d.modalidad_pref, d.jornada_pref, d.salario_min, JSON.stringify(dominios), comparte, u.id],
    );
    await t.query("delete from persona_competencias where persona_id = $1", [u.id]);
    for (const id of elegidas) await t.query("insert into persona_competencias (persona_id, competencia_id) values ($1, $2)", [u.id, id]);
    await t.query("delete from persona_ajustes where persona_id = $1", [u.id]);
    for (const [id, p] of ajustesElegidos) await t.query("insert into persona_ajustes (persona_id, ajuste_id, prioridad) values ($1, $2, $3)", [u.id, id, p]);
  });
  return conAviso(request, "/persona/coincidencias", "Guardamos tu perfil. Tus coincidencias ya están actualizadas.");
}

function Seccion({ id, titulo, ayuda, children }: { id: string; titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="tarjeta tarjeta-grande grid gap-5" aria-labelledby={`t-${id}`}>
      <div>
        <h2 id={`t-${id}`} className="text-3xl">{titulo}</h2>
        {ayuda && <p className="subtitulo mt-1">{ayuda}</p>}
      </div>
      {children}
    </section>
  );
}

export default function Perfil({ loaderData, actionData }: Route.ComponentProps) {
  const { persona, competencias, ajustes, comparteDesde } = loaderData;
  const errores = actionData?.errores;
  const enviando = useNavigation().state === "submitting";
  const [dominios, setDominios] = useState<Record<string, number>>(persona.dominios);
  const [filtro, setFiltro] = useState("");
  const tiene = new Set(persona.competencias.map((c) => c.id));
  const prioridad = new Map(persona.ajustes.map((a) => [a.id, a.prioridad]));
  const sugeridos = new Set(DOMINIOS.filter((d) => (dominios[d.clave] ?? 0) >= 3).flatMap((d) => d.sugiere as readonly string[]));
  const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const visible = (c: (typeof competencias)[number]) => !filtro || [c.nombre, ...c.sinonimos].some((t) => normal(t).includes(normal(filtro)));

  return (
    <div className="contenedor py-8 md:py-12 grid gap-8 max-w-4xl">
      <div className="grid gap-2">
        <h1 className="titulo-pagina">Mi perfil</h1>
        <p className="subtitulo">Con esto calculamos qué vacantes encajan contigo. Puedes cambiarlo cuando quieras.</p>
      </div>
      <ErroresFormulario errores={errores} />
      <Form method="post" className="grid gap-6" noValidate>
        <Seccion id="datos" titulo="Tus datos">
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo etiqueta="Nombre completo" error={errores?.nombre}>
              {(p) => <input {...p} name="nombre" autoComplete="name" className="entrada" defaultValue={persona.nombre} />}
            </Campo>
            <Campo etiqueta="Ciudad" error={errores?.ciudad}>
              {(p) => <input {...p} name="ciudad" autoComplete="address-level2" className="entrada" defaultValue={persona.ciudad} />}
            </Campo>
            <Campo etiqueta="Teléfono" ayuda="Privado: no se muestra a las empresas." opcional>
              {(p) => <input {...p} name="telefono" type="tel" autoComplete="tel" inputMode="tel" className="entrada" defaultValue={persona.telefono ?? ""} />}
            </Campo>
            <Campo etiqueta="Años de experiencia laboral" error={errores?.experiencia_anios}>
              {(p) => <input {...p} name="experiencia_anios" type="number" inputMode="numeric" min={0} max={70} className="entrada num" defaultValue={persona.experiencia_anios} />}
            </Campo>
          </div>
        </Seccion>

        <Seccion id="competencias" titulo="Lo que sabes hacer" ayuda="Marca todo lo que sepas hacer, aunque no tengas un certificado.">
          <div className="campo js-solo">
            <label htmlFor="filtro-comp" className="etiqueta">Buscar</label>
            <div className="flex gap-2">
              <input id="filtro-comp" type="search" className="entrada" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Por ejemplo: cocina, ventas, Excel" />
              <BotonDictar para="filtro-comp" etiquetaCampo="la búsqueda de competencias" />
            </div>
          </div>
          <fieldset>
            <legend className="sr-only">Competencias</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {competencias.map((c) => (
                <label key={c.id} className="opcion" hidden={!visible(c)}>
                  <input type="checkbox" name="competencias" value={c.id} defaultChecked={tiene.has(c.id)} />
                  <span>{c.nombre}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Seccion>

        <Seccion id="preferencias" titulo="El empleo que buscas">
          <fieldset className="grid gap-2">
            <legend className="etiqueta mb-1">¿Cómo prefieres trabajar?</legend>
            <div className="grupo-segmentos">
              {Object.entries(MODALIDADES_PREF).map(([k, t]) => (
                <label key={k} className="segmento"><input type="radio" name="modalidad_pref" value={k} defaultChecked={persona.modalidad_pref === k} /><span>{t}</span></label>
              ))}
            </div>
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="etiqueta mb-1">¿Qué jornada te sirve?</legend>
            <div className="grupo-segmentos">
              {Object.entries(JORNADAS_PREF).map(([k, t]) => (
                <label key={k} className="segmento"><input type="radio" name="jornada_pref" value={k} defaultChecked={persona.jornada_pref === k} /><span>{t}</span></label>
              ))}
            </div>
          </fieldset>
          <Campo etiqueta="Salario mínimo que esperas al mes" ayuda={`En pesos, sin puntos. El salario mínimo de 2026 es ${cop(PARAMETROS_2026.smmlv)}.`} error={errores?.salario_min}>
            {(p) => <input {...p} name="salario_min" type="number" inputMode="numeric" min={0} step={1000} className="entrada num max-w-xs" defaultValue={persona.salario_min || ""} />}
          </Campo>
        </Seccion>

        <Seccion id="dominios" titulo="¿Cómo te va con estas actividades?" ayuda="Es opcional. Solo sirve para sugerirte ajustes. Nunca se usa para calcular tu puntaje y nunca se muestra a las empresas.">
          <div className="grid gap-5">
            {DOMINIOS.map((d) => (
              <fieldset key={d.clave} className="grid gap-2">
                <legend className="etiqueta mb-1">{d.pregunta}</legend>
                <div className="grupo-segmentos">
                  {Object.entries(NIVELES_DIFICULTAD).map(([n, t]) => (
                    <label key={n} className="segmento">
                      <input type="radio" name={`dominio_${d.clave}`} value={n} defaultChecked={persona.dominios[d.clave] === Number(n)}
                        onChange={() => setDominios((x) => ({ ...x, [d.clave]: Number(n) }))} />
                      <span>{t}</span>
                    </label>
                  ))}
                  <label className="segmento">
                    <input type="radio" name={`dominio_${d.clave}`} value="" defaultChecked={!persona.dominios[d.clave]}
                      onChange={() => setDominios((x) => { const y = { ...x }; delete y[d.clave]; return y; })} />
                    <span>Prefiero no responder</span>
                  </label>
                </div>
              </fieldset>
            ))}
          </div>
        </Seccion>

        <Seccion id="ajustes" titulo="Los ajustes que necesitas" ayuda="Marca solo los que necesites. «Esencial» quiere decir que sin eso no puedes trabajar.">
          <ul className="grid gap-4" role="list">
            {ajustes.map((a) => (
              <li key={a.id} className="rounded-3xl bg-suelo p-4 grid gap-3">
                <div>
                  <p className="text-xl font-black flex flex-wrap items-center gap-2">
                    {a.nombre}
                    {sugeridos.has(a.clave) && <span className="estado estado-ajustable text-base">Sugerido por tus respuestas</span>}
                  </p>
                  <p className="text-tinta-2">{a.descripcion}</p>
                </div>
                <fieldset>
                  <legend className="sr-only">{a.nombre}: ¿lo necesitas?</legend>
                  <div className="grupo-segmentos">
                    <label className="segmento"><input type="radio" name={`ajuste_${a.id}`} value="0" defaultChecked={!prioridad.has(a.id)} /><span>No lo necesito</span></label>
                    {([1, 2, 3] as const).map((p) => (
                      <label key={p} className="segmento"><input type="radio" name={`ajuste_${a.id}`} value={p} defaultChecked={prioridad.get(a.id) === p} /><span>{PRIORIDADES[p].nombre}</span></label>
                    ))}
                  </div>
                </fieldset>
              </li>
            ))}
          </ul>
        </Seccion>

        <Seccion id="privacidad" titulo="Qué ven las empresas">
          <label className="opcion !items-start !p-5">
            <input type="checkbox" name="comparte" value="si" defaultChecked={persona.comparte_ajustes} className="mt-1" />
            <span>
              <strong>Autorizo mostrar mis ajustes</strong> a las empresas a las que me postule.
              <span className="block ayuda font-normal mt-1">
                {persona.comparte_ajustes && comparteDesde ? `Autorizado desde el ${fecha(comparteDesde)}. ` : ""}
                Si lo quitas, las empresas siguen viendo tu puntaje y tus competencias, pero no tus ajustes. Tu teléfono y tus respuestas sobre actividades nunca se muestran.
              </span>
            </span>
          </label>
        </Seccion>

        <div className="sticky bottom-24 md:bottom-4 z-20 tarjeta !py-4 flex flex-wrap items-center justify-between gap-3 shadow-[0_18px_40px_-20px_rgb(27_27_31/0.45)]">
          <p className="font-semibold flex items-center gap-2"><Icono nombre="info" className="size-5" /> Los cambios se aplican al guardar.</p>
          <button type="submit" className="btn btn-accion btn-grande" disabled={enviando}>{enviando ? "Guardando…" : "Guardar mi perfil"}</button>
        </div>
      </Form>
    </div>
  );
}
