import { Form, Link, useSearchParams, useSubmit } from "react-router";
import type { Route } from "./+types/coincidencias";
import { q } from "~/.server/db";
import { cargarPersona, cargarVacantes } from "~/.server/datos";
import { requerirUsuario } from "~/.server/sesion";
import { cop, JORNADAS, MODALIDADES } from "~/lib/catalogo";
import { emparejar, explicacionEnVoz } from "~/lib/matching";
import { Icono } from "~/components/Icono";
import { Anillo, BotonEscuchar, FilasCoincidencia, Vacio } from "~/components/ui";

export const meta: Route.MetaFunction = () => [{ title: "Vacantes para ti — IncluTrabajo IA" }];

export async function loader({ request }: Route.LoaderArgs) {
  const u = await requerirUsuario(request, "persona");
  const persona = await cargarPersona(u.id);
  if (!persona) throw new Response("Perfil no encontrado", { status: 404 });
  const soloCompatibles = new URL(request.url).searchParams.get("todas") !== "si";
  const postuladas = new Set(
    (await q<{ vacante_id: number }>("select vacante_id from postulaciones where persona_id = $1 and estado <> 'retirada'", [u.id])).map((r) => r.vacante_id),
  );
  const todas = (await cargarVacantes())
    .map((v) => ({
      id: v.id,
      cargo: v.cargo,
      empresa: v.empresa,
      ciudad: v.ciudad,
      modalidad: v.modalidad,
      jornada: v.jornada,
      salario: v.salario,
      postulada: postuladas.has(v.id),
      r: emparejar(persona, v),
    }))
    .sort((a, b) => Number(b.r.compatible) - Number(a.r.compatible) || b.r.puntaje - a.r.puntaje);
  const lista = soloCompatibles ? todas.filter((t) => t.r.compatible) : todas;
  return { lista, total: todas.length, compatibles: todas.filter((t) => t.r.compatible).length, soloCompatibles, perfilVacio: persona.competencias.length === 0 };
}

export default function Coincidencias({ loaderData }: Route.ComponentProps) {
  const { lista, total, compatibles, soloCompatibles, perfilVacio } = loaderData;
  const [params] = useSearchParams();
  const submit = useSubmit();
  return (
    <div className="contenedor py-8 md:py-12 grid gap-8">
      <div className="grid gap-2">
        <h1 className="titulo-pagina">Vacantes para ti</h1>
        <p className="subtitulo" aria-live="polite">
          {compatibles} de {total} vacantes encajan contigo. Te explicamos cada una, punto por punto.
        </p>
      </div>

      {perfilVacio && (
        <div className="tarjeta flex flex-wrap items-center gap-4" role="note">
          <Icono nombre="info" className="size-7 shrink-0" />
          <p className="grow font-semibold">Aún no nos contaste lo que sabes hacer. Sin eso, los puntajes son más bajos de lo que podrían ser.</p>
          <Link to="/persona/perfil#competencias" className="btn btn-accion">Completar mi perfil</Link>
        </div>
      )}

      <Form method="get" onChange={(e) => submit(e.currentTarget, { preventScrollReset: true, replace: true })}>
        <fieldset className="grupo-segmentos">
          <legend className="sr-only">Qué vacantes mostrar</legend>
          <label className="segmento"><input type="radio" name="todas" value="no" defaultChecked={params.get("todas") !== "si"} /><span>Solo las que encajan</span></label>
          <label className="segmento"><input type="radio" name="todas" value="si" defaultChecked={params.get("todas") === "si"} /><span>Todas</span></label>
          <noscript><button className="btn btn-claro" type="submit">Aplicar</button></noscript>
        </fieldset>
      </Form>

      {lista.length === 0 ? (
        <Vacio
          titulo={soloCompatibles ? "Por ahora ninguna encaja del todo" : "No hay vacantes abiertas"}
          accion={soloCompatibles ? <Link to="?todas=si" className="btn btn-claro">Ver todas y qué les falta</Link> : undefined}
        >
          {soloCompatibles ? "Revisa todas: te decimos qué falta en cada una, y a veces es algo que la empresa puede ajustar." : "Vuelve pronto: publicamos vacantes nuevas cada semana."}
        </Vacio>
      ) : (
        <ul className="grid gap-6" role="list">
          {lista.map((t) => (
            <li key={t.id}>
              <article className="tarjeta tarjeta-grande grid gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]" aria-labelledby={`cargo-${t.id}`}>
                <div className="grid gap-4 content-start">
                  <div className="flex flex-wrap items-center gap-4">
                    <Anillo puntaje={t.r.puntaje} tamano={96} etiqueta={`${t.r.puntaje} de 100, ${t.r.etiqueta}`} />
                    <p className="text-xl font-black leading-tight">{t.r.etiqueta}</p>
                  </div>
                  <div>
                    <h2 id={`cargo-${t.id}`} className="text-2xl">{t.cargo}</h2>
                    <p className="text-tinta-2">{t.empresa}</p>
                    <p className="font-semibold mt-1">{t.ciudad} · {MODALIDADES[t.modalidad]} · {JORNADAS[t.jornada]} · <span className="num">{cop(t.salario)}</span></p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link to={`/vacantes/${t.id}`} className="btn btn-accion">{t.postulada ? "Ver vacante" : "Ver y postularme"}</Link>
                    <BotonEscuchar texto={explicacionEnVoz(t.cargo, t.r)} etiqueta="Escuchar" />
                  </div>
                  {t.postulada && <p className="estado estado-neutro w-fit"><Icono nombre="check" className="size-4" /> Ya te postulaste</p>}
                </div>
                <FilasCoincidencia filas={t.r.filas} />
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
