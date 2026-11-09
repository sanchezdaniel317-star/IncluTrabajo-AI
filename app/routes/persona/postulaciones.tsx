import { data, Form, Link } from "react-router";
import type { Route } from "./+types/postulaciones";
import { db, q, q1 } from "~/.server/db";
import { avisar } from "~/.server/datos";
import { conAviso, requerirUsuario } from "~/.server/sesion";
import { exigirMismoOrigen } from "~/.server/seguridad";
import { ESTADOS_FINALES, ESTADOS_POSTULACION, fecha, PASOS_POSTULACION, type EstadoPostulacion } from "~/lib/catalogo";
import { Icono } from "~/components/Icono";
import { Vacio } from "~/components/ui";

export const meta: Route.MetaFunction = () => [{ title: "Mis postulaciones — IncluTrabajo IA" }];

export async function loader({ request }: Route.LoaderArgs) {
  const u = await requerirUsuario(request, "persona");
  const lista = await q<{ id: number; vacante_id: number; cargo: string; empresa: string; estado: EstadoPostulacion; retroalimentacion: string | null; creada_en: string }>(
    `select p.id, p.vacante_id, v.cargo, us.nombre as empresa, p.estado, p.retroalimentacion, p.creada_en::text
       from postulaciones p join vacantes v on v.id = p.vacante_id join usuarios us on us.id = v.empresa_id
      where p.persona_id = $1 order by p.actualizada_en desc`,
    [u.id],
  );
  const eventos = lista.length
    ? await q<{ postulacion_id: number; hacia: EstadoPostulacion; comentario: string | null; creado_en: string }>(
        "select postulacion_id, hacia, comentario, creado_en::text from postulacion_eventos where postulacion_id = any($1::int[]) order by creado_en",
        [lista.map((p) => p.id)],
      )
    : [];
  return { lista: lista.map((p) => ({ ...p, eventos: eventos.filter((e) => e.postulacion_id === p.id) })) };
}

export async function action({ request }: Route.ActionArgs) {
  exigirMismoOrigen(request);
  const u = await requerirUsuario(request, "persona");
  const form = await request.formData();
  const id = Number(form.get("retirar"));
  const p = await q1<{ id: number; estado: EstadoPostulacion; cargo: string; empresa_id: number; vacante_id: number }>(
    "select p.id, p.estado, v.cargo, v.empresa_id, v.id as vacante_id from postulaciones p join vacantes v on v.id = p.vacante_id where p.id = $1 and p.persona_id = $2",
    [id, u.id],
  );
  if (!p) return data({ error: "No encontramos esa postulación." }, { status: 404 });
  if (ESTADOS_FINALES.includes(p.estado)) return data({ error: "Esa postulación ya está cerrada." }, { status: 409 });
  await (await db()).tx(async (t) => {
    await t.query("update postulaciones set estado = 'retirada', actualizada_en = now() where id = $1", [p.id]);
    await t.query("insert into postulacion_eventos (postulacion_id, desde, hacia, comentario, por) values ($1, $2, 'retirada', 'La persona retiró su postulación.', $3)", [p.id, p.estado, u.id]);
    await avisar(t, p.empresa_id, "Postulación retirada", `${u.nombre} retiró su postulación a ${p.cargo}.`, `/empresa/vacantes/${p.vacante_id}/candidaturas`);
  });
  return conAviso(request, "/persona/postulaciones", `Retiraste tu postulación a ${p.cargo}. Puedes volver a postularte si cambias de opinión.`);
}

function Pasos({ estado }: { estado: EstadoPostulacion }) {
  if (estado === "no_seleccionada" || estado === "retirada") {
    return <p className="estado estado-neutro w-fit">{ESTADOS_POSTULACION[estado]}</p>;
  }
  const actual = PASOS_POSTULACION.indexOf(estado);
  return (
    <ol className="grid grid-cols-4 gap-2" role="list" aria-label="Avance del proceso">
      {PASOS_POSTULACION.map((paso, i) => {
        const hecho = i <= actual;
        return (
          <li key={paso} className="grid gap-2" aria-current={i === actual ? "step" : undefined}>
            <span className={`h-2.5 rounded-full ${hecho ? "bg-tinta" : "bg-suelo-2"}`} aria-hidden="true" />
            <span className={`text-sm sm:text-base leading-tight ${i === actual ? "font-black" : hecho ? "font-semibold" : "text-tinta-2"}`}>
              {ESTADOS_POSTULACION[paso]}
              <span className="sr-only">{i === actual ? " (estado actual)" : hecho ? " (hecho)" : " (pendiente)"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function Postulaciones({ loaderData, actionData }: Route.ComponentProps) {
  const { lista } = loaderData;
  return (
    <div className="contenedor py-8 md:py-12 grid gap-8 max-w-4xl">
      <div className="grid gap-2">
        <h1 className="titulo-pagina">Mis postulaciones</h1>
        <p className="subtitulo">En qué va cada proceso y qué te dijo la empresa.</p>
      </div>
      {actionData?.error && <p role="alert" className="error-campo">{actionData.error}</p>}
      {lista.length === 0 ? (
        <Vacio titulo="Aún no te has postulado" accion={<Link to="/persona/coincidencias" className="btn btn-accion">Ver vacantes para ti</Link>}>
          Revisa las vacantes que encajan contigo y postúlate con un toque.
        </Vacio>
      ) : (
        <ul className="grid gap-5" role="list">
          {lista.map((p) => (
            <li key={p.id} className="tarjeta tarjeta-grande grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl"><Link to={`/vacantes/${p.vacante_id}`} className="no-underline hover:underline">{p.cargo}</Link></h2>
                  <p className="text-tinta-2">{p.empresa} · te postulaste el {fecha(p.creada_en)}</p>
                </div>
              </div>
              <Pasos estado={p.estado} />
              {p.retroalimentacion && (
                <blockquote className="rounded-3xl bg-suelo p-4">
                  <p className="ayuda font-bold">La empresa te escribió</p>
                  <p className="text-lg mt-1">{p.retroalimentacion}</p>
                </blockquote>
              )}
              <details className="rounded-3xl border-2 border-filete p-4">
                <summary className="font-bold cursor-pointer">Historial</summary>
                <ol className="grid gap-2 mt-3" role="list">
                  {p.eventos.map((e, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="num text-tinta-2 shrink-0 w-28">{fecha(e.creado_en)}</span>
                      <span><strong>{ESTADOS_POSTULACION[e.hacia]}</strong>{e.comentario ? ` — ${e.comentario}` : ""}</span>
                    </li>
                  ))}
                </ol>
              </details>
              {!ESTADOS_FINALES.includes(p.estado) && (
                <details className="panel-desplegable">
                  <summary className="btn btn-peligro w-fit">Retirar mi postulación</summary>
                  <Form method="post" className="mt-3 rounded-3xl bg-falta-suave p-4 grid gap-3">
                    <p className="font-bold">¿Seguro? La empresa dejará de ver tu postulación. Podrás volver a postularte después.</p>
                    <button className="btn btn-peligro w-fit" name="retirar" value={p.id}>Sí, retirarla</button>
                  </Form>
                </details>
              )}
              {p.estado === "retirada" && (
                <Link to={`/vacantes/${p.vacante_id}`} className="btn btn-claro w-fit">Volver a postularme <Icono nombre="flecha" className="size-5" /></Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
