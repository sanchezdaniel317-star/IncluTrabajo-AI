import { data, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/candidaturas";
import { db, q, q1 } from "~/.server/db";
import { avisar, cargarPersona, cargarVacante } from "~/.server/datos";
import { conAviso, requerirUsuario } from "~/.server/sesion";
import { exigirMismoOrigen } from "~/.server/seguridad";
import { ESTADOS_POSTULACION, fecha, PRIORIDADES, TRANSICIONES, type EstadoPostulacion } from "~/lib/catalogo";
import { emparejar } from "~/lib/matching";
import { Icono } from "~/components/Icono";
import { Anillo, Campo, FilasCoincidencia, Vacio } from "~/components/ui";

export const meta: Route.MetaFunction = ({ data: d }) => [{ title: `Candidaturas · ${d?.vacante.cargo ?? ""} — IncluTrabajo IA` }];

export async function loader({ request, params }: Route.LoaderArgs) {
  const u = await requerirUsuario(request, "empresa");
  const vacante = await cargarVacante(Number(params.id));
  if (!vacante || vacante.empresa_id !== u.id) throw new Response("No encontrada", { status: 404 });
  const post = await q<{ id: number; persona_id: number; estado: EstadoPostulacion; retroalimentacion: string | null; creada_en: string }>(
    "select id, persona_id, estado, retroalimentacion, creada_en::text from postulaciones where vacante_id = $1",
    [vacante.id],
  );
  const eventos = post.length
    ? await q<{ postulacion_id: number; hacia: EstadoPostulacion; comentario: string | null; creado_en: string }>(
        "select postulacion_id, hacia, comentario, creado_en::text from postulacion_eventos where postulacion_id = any($1::int[]) order by creado_en",
        [post.map((p) => p.id)],
      )
    : [];
  const filas = [];
  for (const p of post) {
    const persona = await cargarPersona(p.persona_id);
    if (!persona) continue;
    const r = emparejar(persona, vacante, "empresa");
    filas.push({
      ...p,
      nombre: persona.nombre,
      email: persona.email,
      ciudad: persona.ciudad,
      experiencia: persona.experiencia_anios,
      competencias: persona.competencias.map((c) => c.nombre),
      comparte: persona.comparte_ajustes,
      // Sin autorización, la empresa no ve los ajustes ni las filas que los nombran.
      ajustes: persona.comparte_ajustes ? persona.ajustes.map((a) => ({ nombre: a.nombre, prioridad: a.prioridad })) : [],
      puntaje: r.puntaje,
      etiqueta: r.etiqueta,
      filas: persona.comparte_ajustes ? r.filas : r.filas.filter((f) => f.criterio !== "ajuste"),
      eventos: eventos.filter((e) => e.postulacion_id === p.id),
      siguientes: TRANSICIONES[p.estado],
    });
  }
  filas.sort((a, b) => Number(a.estado === "retirada") - Number(b.estado === "retirada") || b.puntaje - a.puntaje);
  return { vacante: { id: vacante.id, cargo: vacante.cargo, activa: vacante.activa }, filas };
}

export async function action({ request, params }: Route.ActionArgs) {
  exigirMismoOrigen(request);
  const u = await requerirUsuario(request, "empresa");
  const form = await request.formData();
  const id = Number(form.get("postulacion"));
  const hacia = String(form.get("estado") ?? "") as EstadoPostulacion;
  const comentario = String(form.get("comentario") ?? "").trim().slice(0, 2000) || null;
  const p = await q1<{ id: number; estado: EstadoPostulacion; persona_id: number; cargo: string }>(
    `select p.id, p.estado, p.persona_id, v.cargo from postulaciones p join vacantes v on v.id = p.vacante_id
      where p.id = $1 and v.id = $2 and v.empresa_id = $3`,
    [id, Number(params.id), u.id],
  );
  if (!p) return data({ id, error: "No encontramos esa candidatura." }, { status: 404 });
  if (!TRANSICIONES[p.estado].includes(hacia)) {
    return data({ id, error: `No se puede pasar de «${ESTADOS_POSTULACION[p.estado]}» a «${ESTADOS_POSTULACION[hacia] ?? hacia}».` }, { status: 409 });
  }
  if (hacia === "no_seleccionada" && !comentario) {
    return data({ id, error: "Escribe un mensaje para la persona: qué pasó y qué podría mejorar. Es obligatorio al no seleccionar." }, { status: 400 });
  }
  await (await db()).tx(async (t) => {
    await t.query("update postulaciones set estado = $1, retroalimentacion = coalesce($2, retroalimentacion), actualizada_en = now() where id = $3", [hacia, comentario, p.id]);
    await t.query("insert into postulacion_eventos (postulacion_id, desde, hacia, comentario, por) values ($1, $2, $3, $4, $5)", [p.id, p.estado, hacia, comentario, u.id]);
    await avisar(t, p.persona_id, hacia === "contratada" ? "¡Te contrataron!" : "Tu postulación cambió", `${p.cargo} · ${u.nombre}: ahora está en «${ESTADOS_POSTULACION[hacia]}».${comentario ? " " + comentario : ""}`, "/persona/postulaciones");
  });
  return conAviso(request, `/empresa/vacantes/${params.id}/candidaturas`, `Actualizaste la candidatura a «${ESTADOS_POSTULACION[hacia]}». Le avisamos a la persona.`);
}

export default function Candidaturas({ loaderData, actionData }: Route.ComponentProps) {
  const { vacante, filas } = loaderData;
  const enviando = useNavigation().state === "submitting";
  return (
    <div className="contenedor py-8 md:py-12 grid gap-8">
      <Link to="/empresa" className="enlace inline-flex items-center gap-2 w-fit"><Icono nombre="atras" className="size-5" /> Volver al panel</Link>
      <div className="grid gap-2">
        <h1 className="titulo-pagina">Candidaturas · {vacante.cargo}</h1>
        <p className="subtitulo">Ordenadas por compatibilidad actual. El puntaje no usa edad, sexo, etnia, nacionalidad ni discapacidad.</p>
      </div>
      {filas.length === 0 ? (
        <Vacio titulo="Todavía no hay candidaturas" accion={<Link to={`/empresa/vacantes/${vacante.id}`} className="btn btn-claro">Revisar la vacante</Link>}>
          Las vacantes con ajustes verificados y una descripción clara reciben más postulaciones.
        </Vacio>
      ) : (
        <ol className="grid gap-5" role="list">
          {filas.map((f, i) => (
            <li key={f.id} className="tarjeta tarjeta-grande grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
              <div className="grid gap-4 content-start">
                <div className="flex flex-wrap items-center gap-4">
                  <Anillo puntaje={f.puntaje} tamano={84} etiqueta={`${f.puntaje} de 100, ${f.etiqueta}`} />
                  <div className="min-w-0">
                    <h2 className="text-2xl"><span className="sr-only">Posición {i + 1} en el ranking: </span>{f.nombre}</h2>
                    <p className="text-tinta-2">{f.ciudad} · {f.experiencia} {f.experiencia === 1 ? "año" : "años"} de experiencia · se postuló el {fecha(f.creada_en)}</p>
                    <p className="font-black mt-0.5">{f.etiqueta} · {ESTADOS_POSTULACION[f.estado]}</p>
                  </div>
                </div>
                <FilasCoincidencia filas={f.filas} compacto />
                <div className="grid gap-2">
                  <p className="font-bold">Competencias</p>
                  <ul className="flex flex-wrap gap-2" role="list">
                    {f.competencias.map((c) => <li key={c} className="rounded-full bg-suelo px-3 py-1 font-semibold">{c}</li>)}
                  </ul>
                </div>
                {f.comparte ? (
                  f.ajustes.length > 0 && (
                    <div className="grid gap-2">
                      <p className="font-bold">Ajustes que necesita</p>
                      <ul className="flex flex-wrap gap-2" role="list">
                        {f.ajustes.map((a) => <li key={a.nombre} className="rounded-full bg-suelo px-3 py-1 font-semibold">{a.nombre} · {PRIORIDADES[a.prioridad].nombre.toLowerCase()}</li>)}
                      </ul>
                    </div>
                  )
                ) : (
                  <p className="ayuda flex items-center gap-2"><Icono nombre="escudo" className="size-5" /> Esta persona no autorizó mostrar sus ajustes.</p>
                )}
                <p>Contacto: <a className="enlace" href={`mailto:${f.email}`}>{f.email}</a></p>
              </div>
              <div className="grid gap-4 content-start">
                {f.siguientes.length > 0 ? (
                  <Form method="post" className="rounded-3xl bg-suelo p-4 grid gap-4">
                    <input type="hidden" name="postulacion" value={f.id} />
                    <fieldset className="grid gap-2">
                      <legend className="etiqueta mb-1">Mover a</legend>
                      <div className="grupo-segmentos">
                        {f.siguientes.map((s, j) => (
                          <label key={s} className="segmento"><input type="radio" name="estado" value={s} defaultChecked={j === 0} /><span>{ESTADOS_POSTULACION[s]}</span></label>
                        ))}
                      </div>
                    </fieldset>
                    <Campo etiqueta="Mensaje para la persona" ayuda="Obligatorio si no la seleccionas. Sé claro y amable." opcional error={actionData?.id === f.id ? actionData.error : undefined}>
                      {(p) => <textarea {...p} name="comentario" className="entrada !min-h-24" rows={3} />}
                    </Campo>
                    <button className="btn btn-accion" disabled={enviando}>Guardar y avisar</button>
                  </Form>
                ) : (
                  <p className="rounded-3xl bg-suelo p-4 font-bold">Proceso cerrado: {ESTADOS_POSTULACION[f.estado]}.</p>
                )}
                <details className="rounded-3xl border-2 border-filete p-4">
                  <summary className="font-bold cursor-pointer">Historial</summary>
                  <ol className="grid gap-2 mt-3" role="list">
                    {f.eventos.map((e, k) => (
                      <li key={k}><span className="num text-tinta-2">{fecha(e.creado_en)}</span> · <strong>{ESTADOS_POSTULACION[e.hacia]}</strong>{e.comentario ? ` — ${e.comentario}` : ""}</li>
                    ))}
                  </ol>
                </details>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
