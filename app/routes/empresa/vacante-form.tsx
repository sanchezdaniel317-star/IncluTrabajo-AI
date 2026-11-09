import { data, Form, Link, useNavigation } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/vacante-form";
import { db } from "~/.server/db";
import { cargarVacante, catalogos } from "~/.server/datos";
import { conAviso, requerirUsuario } from "~/.server/sesion";
import { exigirMismoOrigen } from "~/.server/seguridad";
import { cop, fecha, JORNADAS, MODALIDADES } from "~/lib/catalogo";
import { PARAMETROS_2026 } from "~/lib/cumplimiento";
import { CRITERIOS_IAP, VALORES_IAP } from "~/lib/iap";
import { Icono } from "~/components/Icono";
import { BotonDictar, Campo, ErroresFormulario } from "~/components/ui";

export const meta: Route.MetaFunction = ({ data: d }) => [{ title: `${d?.vacante ? "Editar vacante" : "Publicar vacante"} — IncluTrabajo IA` }];

export async function loader({ request, params }: Route.LoaderArgs) {
  const u = await requerirUsuario(request, "empresa");
  const cat = await catalogos();
  if (!params.id) return { vacante: null, ...cat };
  const vacante = await cargarVacante(Number(params.id));
  if (!vacante || vacante.empresa_id !== u.id) throw new Response("No encontrada", { status: 404 });
  return { vacante, ...cat };
}

const esquema = z.object({
  cargo: z.string().trim().min(3, "Escribe el nombre del cargo.").max(150),
  descripcion: z.string().trim().min(10, "Describe las tareas en al menos una frase.").max(4000, "La descripción es muy larga."),
  ciudad: z.string().trim().min(2, "Escribe la ciudad.").max(100),
  modalidad: z.enum(["presencial", "hibrido", "remoto"], { message: "Elige la modalidad." }),
  jornada: z.enum(["completa", "medio_tiempo"], { message: "Elige la jornada." }),
  salario: z.coerce.number({ message: "Escribe el salario en números, sin puntos." }).int().positive("El salario debe ser mayor que cero.").max(100_000_000),
});

export async function action({ request, params }: Route.ActionArgs) {
  exigirMismoOrigen(request);
  const u = await requerirUsuario(request, "empresa");
  const editar = params.id ? await cargarVacante(Number(params.id)) : null;
  if (params.id && (!editar || editar.empresa_id !== u.id)) throw new Response("No encontrada", { status: 404 });
  const form = await request.formData();
  const r = esquema.safeParse({
    cargo: form.get("cargo"),
    descripcion: form.get("descripcion"),
    ciudad: form.get("ciudad"),
    modalidad: form.get("modalidad"),
    jornada: form.get("jornada"),
    salario: String(form.get("salario") ?? "").replace(/[.\s$]/g, ""),
  });
  const errores: Record<string, string> = {};
  if (!r.success) for (const i of r.error.issues) errores[String(i.path[0])] ??= i.message;
  if (r.success && r.data.jornada === "completa" && r.data.salario < PARAMETROS_2026.smmlv) {
    errores.salario = `Para tiempo completo el salario no puede ser menor al mínimo legal (${cop(PARAMETROS_2026.smmlv)}).`;
  }
  const { competencias, ajustes } = await catalogos();
  const idsComp = new Set(competencias.map((c) => c.id));
  const requisitos = form.getAll("competencias").map(Number).filter((id) => idsComp.has(id));
  const ofrecidos: { id: number; estado: "declarado" | "ajustable" | "verificado"; compromiso: string | null }[] = [];
  for (const a of ajustes) {
    const v = String(form.get(`ajuste_${a.id}`) ?? "no");
    const previo = editar?.ajustes.find((x) => x.id === a.id);
    if (v === "mantener" && previo?.estado === "verificado") ofrecidos.push({ id: a.id, estado: "verificado", compromiso: null });
    else if (v === "declarado") ofrecidos.push({ id: a.id, estado: "declarado", compromiso: null });
    else if (v === "ajustable") {
      const f = String(form.get(`compromiso_${a.id}`) ?? "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) errores[`compromiso_${a.id}`] = `Pon la fecha en que tendrás «${a.nombre}».`;
      ofrecidos.push({ id: a.id, estado: "ajustable", compromiso: f || null });
    }
  }
  if (Object.keys(errores).length || !r.success) return data({ errores }, { status: 400 });
  const iap: [string, number][] = [];
  for (const c of CRITERIOS_IAP) {
    const v = form.get(`iap_${c.clave}`);
    if (v === "1" || v === "0.5" || v === "0") iap.push([c.clave, Number(v)]);
  }
  const d = r.data;
  const activa = editar ? form.get("activa") === "si" : true;
  const id = await (await db()).tx(async (t) => {
    let vid: number;
    if (editar) {
      vid = editar.id;
      await t.query(
        "update vacantes set cargo = $1, descripcion = $2, ciudad = $3, modalidad = $4, jornada = $5, salario = $6, activa = $7, actualizada_en = now() where id = $8",
        [d.cargo, d.descripcion, d.ciudad, d.modalidad, d.jornada, d.salario, activa, vid],
      );
    } else {
      const [v] = await t.query<{ id: number }>(
        "insert into vacantes (empresa_id, cargo, descripcion, ciudad, modalidad, jornada, salario) values ($1, $2, $3, $4, $5, $6, $7) returning id",
        [u.id, d.cargo, d.descripcion, d.ciudad, d.modalidad, d.jornada, d.salario],
      );
      vid = v.id;
    }
    await t.query("delete from vacante_competencias where vacante_id = $1", [vid]);
    for (const c of requisitos) await t.query("insert into vacante_competencias (vacante_id, competencia_id) values ($1, $2)", [vid, c]);
    const previos = new Map((editar?.ajustes ?? []).map((a) => [a.id, a]));
    await t.query("delete from vacante_ajustes where vacante_id = $1", [vid]);
    for (const o of ofrecidos) {
      const p = previos.get(o.id);
      await t.query(
        "insert into vacante_ajustes (vacante_id, ajuste_id, estado, evidencia, verificado_en, compromiso_en) values ($1, $2, $3, $4, $5, $6)",
        [vid, o.id, o.estado, o.estado === "verificado" ? p?.evidencia ?? null : null, o.estado === "verificado" ? p?.verificado_en ?? null : null, o.compromiso],
      );
    }
    await t.query("delete from vacante_iap where vacante_id = $1", [vid]);
    for (const [criterio, valor] of iap) await t.query("insert into vacante_iap (vacante_id, criterio, valor) values ($1, $2, $3)", [vid, criterio, valor]);
    return vid;
  });
  return conAviso(request, "/empresa", editar ? `Guardamos los cambios de ${d.cargo}.` : `Publicaste ${d.cargo}. Las personas que encajan ya la pueden ver.`);
}

export default function VacanteForm({ loaderData, actionData }: Route.ComponentProps) {
  const { vacante: v, competencias, ajustes } = loaderData;
  const errores = actionData?.errores;
  const enviando = useNavigation().state === "submitting";
  const previo = new Map((v?.ajustes ?? []).map((a) => [a.id, a]));
  const req = new Set((v?.requisitos ?? []).map((r) => r.id));
  const inicial = (id: number) => {
    const p = previo.get(id);
    return !p ? "no" : p.estado === "verificado" ? "mantener" : p.estado;
  };
  return (
    <div className="contenedor py-8 md:py-12 grid gap-8 max-w-4xl">
      <Link to="/empresa" className="enlace inline-flex items-center gap-2 w-fit"><Icono nombre="atras" className="size-5" /> Volver al panel</Link>
      <div className="grid gap-2">
        <h1 className="titulo-pagina">{v ? "Editar vacante" : "Publicar vacante"}</h1>
        <p className="subtitulo">Entre más claro el puesto y su accesibilidad, mejores las coincidencias.</p>
      </div>
      <ErroresFormulario errores={errores} />
      <Form method="post" className="grid gap-6" noValidate>
        <section className="tarjeta tarjeta-grande grid gap-5" aria-labelledby="t-puesto">
          <h2 id="t-puesto" className="text-3xl">El puesto</h2>
          <Campo etiqueta="Cargo" ayuda="Como lo diría alguien de afuera. Por ejemplo: «Auxiliar de bodega»." error={errores?.cargo}>
            {(p) => <input {...p} name="cargo" className="entrada" defaultValue={v?.cargo} />}
          </Campo>
          <Campo etiqueta="¿Qué hace la persona en el día a día?" ayuda="Frases cortas, sin siglas. Esto lo leen también personas con lector de pantalla o lectura fácil." error={errores?.descripcion} id="descripcion">
            {(p) => (
              <div className="grid gap-2">
                <textarea {...p} name="descripcion" className="entrada" defaultValue={v?.descripcion} rows={5} />
                <div><BotonDictar para="descripcion" etiquetaCampo="la descripción" /></div>
              </div>
            )}
          </Campo>
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo etiqueta="Ciudad" error={errores?.ciudad}>
              {(p) => <input {...p} name="ciudad" className="entrada" defaultValue={v?.ciudad} />}
            </Campo>
            <Campo etiqueta="Salario mensual" ayuda="En pesos, sin puntos." error={errores?.salario}>
              {(p) => <input {...p} name="salario" type="number" inputMode="numeric" min={1} step={1000} className="entrada num" defaultValue={v?.salario} />}
            </Campo>
          </div>
          <fieldset className="grid gap-2">
            <legend className="etiqueta mb-1">Modalidad</legend>
            <div className="grupo-segmentos">
              {Object.entries(MODALIDADES).map(([k, t]) => <label key={k} className="segmento"><input type="radio" name="modalidad" value={k} defaultChecked={(v?.modalidad ?? "presencial") === k} /><span>{t}</span></label>)}
            </div>
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="etiqueta mb-1">Jornada</legend>
            <div className="grupo-segmentos">
              {Object.entries(JORNADAS).map(([k, t]) => <label key={k} className="segmento"><input type="radio" name="jornada" value={k} defaultChecked={(v?.jornada ?? "completa") === k} /><span>{t}</span></label>)}
            </div>
          </fieldset>
          {v && (
            <label className="opcion w-fit">
              <input type="checkbox" name="activa" value="si" defaultChecked={v.activa} />
              <span>Vacante abierta (si la desmarcas, deja de aparecer)</span>
            </label>
          )}
        </section>

        <section className="tarjeta tarjeta-grande grid gap-5" aria-labelledby="t-comp">
          <h2 id="t-comp" className="text-3xl">Lo que pide</h2>
          <fieldset>
            <legend className="sr-only">Competencias requeridas</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {competencias.map((c) => (
                <label key={c.id} className="opcion"><input type="checkbox" name="competencias" value={c.id} defaultChecked={req.has(c.id)} /><span>{c.nombre}</span></label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="tarjeta tarjeta-grande grid gap-5" aria-labelledby="t-ajustes">
          <div>
            <h2 id="t-ajustes" className="text-3xl">Accesibilidad que ofrece el puesto</h2>
            <p className="subtitulo mt-1">Lo que marques queda como «declarado». Nuestro equipo técnico lo verifica en una visita y le pone el sello.</p>
          </div>
          <ul className="grid gap-4" role="list">
            {ajustes.map((a) => {
              const p = previo.get(a.id);
              const err = errores?.[`compromiso_${a.id}`];
              return (
                <li key={a.id} className="rounded-3xl bg-suelo p-4 grid gap-3">
                  <div>
                    <p className="text-xl font-black">{a.nombre}</p>
                    <p className="text-tinta-2">{a.descripcion}</p>
                  </div>
                  <fieldset>
                    <legend className="sr-only">{a.nombre}</legend>
                    <div className="grupo-segmentos">
                      <label className="segmento"><input type="radio" name={`ajuste_${a.id}`} value="no" defaultChecked={inicial(a.id) === "no"} /><span>No lo ofrece</span></label>
                      {p?.estado === "verificado" ? (
                        <label className="segmento"><input type="radio" name={`ajuste_${a.id}`} value="mantener" defaultChecked={inicial(a.id) === "mantener"} /><span>Verificado el {fecha(p.verificado_en)}</span></label>
                      ) : null}
                      <label className="segmento"><input type="radio" name={`ajuste_${a.id}`} value="declarado" defaultChecked={inicial(a.id) === "declarado"} /><span>Lo ofrece</span></label>
                      <label className="segmento"><input type="radio" name={`ajuste_${a.id}`} value="ajustable" defaultChecked={inicial(a.id) === "ajustable"} /><span>Se puede ajustar</span></label>
                    </div>
                  </fieldset>
                  <div className={`fecha-compromiso ${err ? "mostrar" : ""}`}>
                    <Campo etiqueta="¿Para qué fecha lo tendrán?" error={err}>
                      {(pp) => <input {...pp} name={`compromiso_${a.id}`} type="date" className="entrada max-w-xs" defaultValue={p?.compromiso_en ?? ""} />}
                    </Campo>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="tarjeta tarjeta-grande grid gap-5" aria-labelledby="t-iap">
          <div>
            <h2 id="t-iap" className="text-3xl">Índice de Accesibilidad del Puesto</h2>
            <p className="subtitulo mt-1">Tu autoevaluación. En la visita técnica la confirmamos con mediciones. Si no sabes, déjalo sin marcar.</p>
          </div>
          <div className="grid gap-5">
            {CRITERIOS_IAP.map((c) => (
              <fieldset key={c.clave} className="grid gap-2">
                <legend className="etiqueta">{c.nombre} <span className="font-semibold text-tinta-2">· pesa {c.peso}</span></legend>
                <p className="ayuda">{c.ayuda}</p>
                <div className="grupo-segmentos">
                  {VALORES_IAP.map((x) => (
                    <label key={x.valor} className="segmento"><input type="radio" name={`iap_${c.clave}`} value={x.valor} defaultChecked={v?.iapValores[c.clave] === x.valor} /><span>{x.nombre}</span></label>
                  ))}
                  <label className="segmento"><input type="radio" name={`iap_${c.clave}`} value="" defaultChecked={v?.iapValores[c.clave] === undefined} /><span>No sé</span></label>
                </div>
              </fieldset>
            ))}
          </div>
        </section>

        <div className="sticky bottom-24 md:bottom-4 z-20 tarjeta !py-4 flex flex-wrap items-center justify-between gap-3 shadow-[0_18px_40px_-20px_rgb(27_27_31/0.45)]">
          <Link to="/empresa" className="btn btn-claro">Cancelar</Link>
          <button type="submit" className="btn btn-accion btn-grande" disabled={enviando}>{enviando ? "Guardando…" : v ? "Guardar cambios" : "Publicar vacante"}</button>
        </div>
      </Form>
    </div>
  );
}
