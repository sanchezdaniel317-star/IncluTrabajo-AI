import { data, Form, Link, useNavigation } from "react-router";
import type { Route } from "./+types/vacante";
import { db, q1 } from "~/.server/db";
import { avisar, cargarPersona, cargarVacante } from "~/.server/datos";
import { conAviso, requerirUsuario, usuarioActual } from "~/.server/sesion";
import { exigirMismoOrigen } from "~/.server/seguridad";
import { cop, ESTADOS_AJUSTE, ESTADOS_POSTULACION, fecha, JORNADAS, MODALIDADES, type EstadoPostulacion } from "~/lib/catalogo";
import { CRITERIOS_IAP } from "~/lib/iap";
import { emparejar, explicacionEnVoz } from "~/lib/matching";
import { Icono } from "~/components/Icono";
import { Anillo, BotonEscuchar, EstadoAjusteChip, FilasCoincidencia } from "~/components/ui";

export const meta: Route.MetaFunction = ({ data: d }) => [
  { title: d ? `${d.vacante.cargo} · ${d.vacante.empresa} — IncluTrabajo IA` : "Vacante — IncluTrabajo IA" },
];

export async function loader({ request, params }: Route.LoaderArgs) {
  const vacante = await cargarVacante(Number(params.id));
  if (!vacante) throw new Response("No encontrada", { status: 404 });
  const usuario = await usuarioActual(request);
  if (!vacante.activa && !(usuario?.rol === "empresa" && usuario.id === vacante.empresa_id)) {
    throw new Response("No encontrada", { status: 404 });
  }
  let match = null;
  let postulacion: { estado: EstadoPostulacion } | null = null;
  if (usuario?.rol === "persona") {
    const persona = await cargarPersona(usuario.id);
    if (persona) match = emparejar(persona, vacante);
    postulacion = (await q1<{ estado: EstadoPostulacion }>("select estado from postulaciones where persona_id = $1 and vacante_id = $2", [usuario.id, vacante.id])) ?? null;
  }
  return { vacante, match, postulacion, rol: usuario?.rol ?? null };
}

export async function action({ request, params }: Route.ActionArgs) {
  exigirMismoOrigen(request);
  const usuario = await requerirUsuario(request, "persona");
  const vacante = await cargarVacante(Number(params.id));
  if (!vacante || !vacante.activa) return data({ error: "Esta vacante ya no está abierta." }, { status: 409 });
  const persona = await cargarPersona(usuario.id);
  if (!persona) return data({ error: "Completa tu perfil antes de postularte." }, { status: 400 });
  const r = emparejar(persona, vacante);
  const existente = await q1<{ id: number; estado: EstadoPostulacion }>("select id, estado from postulaciones where persona_id = $1 and vacante_id = $2", [usuario.id, vacante.id]);
  if (existente && existente.estado !== "retirada") return data({ error: "Ya te postulaste a esta vacante." }, { status: 409 });
  await (await db()).tx(async (t) => {
    let id: number;
    if (existente) {
      // Quien retiró su postulación puede volver a postularse.
      await t.query("update postulaciones set estado = 'postulada', puntaje_inicial = $1, retroalimentacion = null, actualizada_en = now() where id = $2", [r.puntaje, existente.id]);
      id = existente.id;
      await t.query("insert into postulacion_eventos (postulacion_id, desde, hacia, comentario, por) values ($1, 'retirada', 'postulada', 'Volvió a postularse.', $2)", [id, usuario.id]);
    } else {
      const [p] = await t.query<{ id: number }>("insert into postulaciones (persona_id, vacante_id, puntaje_inicial) values ($1, $2, $3) returning id", [usuario.id, vacante.id, r.puntaje]);
      id = p.id;
      await t.query("insert into postulacion_eventos (postulacion_id, hacia, por) values ($1, 'postulada', $2)", [id, usuario.id]);
    }
    await avisar(t, vacante.empresa_id, "Nueva postulación", `${usuario.nombre} se postuló a ${vacante.cargo}.`, `/empresa/vacantes/${vacante.id}/candidaturas`);
  });
  return conAviso(request, "/persona/postulaciones", `Te postulaste a ${vacante.cargo}. Te avisaremos cuando la empresa responda.`);
}

export default function Vacante({ loaderData, actionData }: Route.ComponentProps) {
  const { vacante: v, match, postulacion, rol } = loaderData;
  const enviando = useNavigation().state === "submitting";
  const puedePostular = rol === "persona" && v.activa && (!postulacion || postulacion.estado === "retirada");
  return (
    <div className="contenedor py-8 md:py-12 grid gap-8">
      <Link to="/vacantes" className="enlace inline-flex items-center gap-2 w-fit"><Icono nombre="atras" className="size-5" /> Todas las vacantes</Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
        <article className="grid gap-6">
          <header className="tarjeta tarjeta-grande grid gap-4">
            {!v.activa && <p className="estado estado-falta w-fit">Vacante cerrada</p>}
            <h1 className="titulo-pagina">{v.cargo}</h1>
            <p className="text-xl text-tinta-2">{v.empresa} · {v.sector}</p>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-suelo p-4"><dt className="ayuda font-bold">Lugar</dt><dd className="font-black text-lg">{v.ciudad} · {MODALIDADES[v.modalidad]}</dd></div>
              <div className="rounded-3xl bg-suelo p-4"><dt className="ayuda font-bold">Jornada</dt><dd className="font-black text-lg">{JORNADAS[v.jornada]}</dd></div>
              <div className="rounded-3xl bg-suelo p-4"><dt className="ayuda font-bold">Salario</dt><dd className="font-black text-lg num">{cop(v.salario)} al mes</dd></div>
            </dl>
            <p className="text-lg max-w-[68ch]">{v.descripcion}</p>
            {v.requisitos.length > 0 && (
              <div className="grid gap-2">
                <h2 className="text-xl">Lo que pide el puesto</h2>
                <ul className="flex flex-wrap gap-2" role="list">
                  {v.requisitos.map((r) => <li key={r.id} className="rounded-full bg-suelo px-4 py-1.5 font-bold">{r.nombre}</li>)}
                </ul>
              </div>
            )}
          </header>

          <section className="tarjeta tarjeta-grande grid gap-5" aria-labelledby="titulo-accesibilidad">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="titulo-accesibilidad" className="text-3xl">Accesibilidad del puesto</h2>
                <p className="text-tinta-2 mt-1">Qué ofrece y cómo lo sabemos.</p>
              </div>
              {v.iap && (
                <p className="rounded-3xl bg-suelo px-5 py-3">
                  <span className="block ayuda font-bold">Índice de accesibilidad</span>
                  <span className="text-3xl font-black num">{v.iap.valor}</span> <span className="font-bold">de 100 · {v.iap.nombre}</span>
                </p>
              )}
            </div>
            {v.ajustes.length === 0 ? (
              <p className="text-tinta-2">La empresa aún no ha declarado ajustes para este puesto.</p>
            ) : (
              <ul className="grid gap-3" role="list">
                {v.ajustes.map((a) => (
                  <li key={a.id} className="rounded-3xl bg-suelo p-4 grid gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xl">{a.nombre}</h3>
                      <EstadoAjusteChip estado={a.estado} verificadoEn={a.verificado_en} compromisoEn={a.compromiso_en} />
                    </div>
                    <p className="text-tinta-2">{a.evidencia ?? ESTADOS_AJUSTE[a.estado].ayuda}</p>
                  </li>
                ))}
              </ul>
            )}
            {v.iap && (
              <details className="rounded-3xl border-2 border-filete p-4">
                <summary className="font-bold cursor-pointer">Ver el índice por criterio</summary>
                <table className="w-full mt-3 text-left">
                  <caption className="sr-only">Índice de Accesibilidad del Puesto por criterio</caption>
                  <thead><tr><th scope="col" className="py-2">Criterio</th><th scope="col" className="py-2">Peso</th><th scope="col" className="py-2">Resultado</th></tr></thead>
                  <tbody>
                    {CRITERIOS_IAP.map((c) => {
                      const x = v.iapValores[c.clave];
                      return (
                        <tr key={c.clave} className="border-t border-filete">
                          <th scope="row" className="py-2 font-semibold">{c.nombre}</th>
                          <td className="py-2 num">{c.peso}</td>
                          <td className="py-2">{x === undefined ? "Sin evaluar" : x === 1 ? "Cumple" : x === 0.5 ? "En parte" : "No cumple"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </details>
            )}
          </section>
        </article>

        <aside className="grid gap-4 lg:sticky lg:top-6" aria-label="Tu coincidencia con esta vacante">
          {match ? (
            <div className="tarjeta tarjeta-grande grid gap-5">
              <div className="flex flex-wrap items-center gap-4">
                <Anillo puntaje={match.puntaje} tamano={104} etiqueta={`${match.puntaje} de 100, ${match.etiqueta}`} />
                <div className="min-w-0 basis-40 grow">
                  <p className="text-2xl font-black leading-tight">{match.etiqueta}</p>
                  <p className="ayuda">{match.confianza === "alta" ? "Con todos los datos" : "Completa tu perfil para un puntaje más preciso"}</p>
                </div>
              </div>
              <FilasCoincidencia filas={match.filas} />
              <BotonEscuchar texto={explicacionEnVoz(v.cargo, match)} />
            </div>
          ) : (
            <div className="tarjeta tarjeta-grande grid gap-3">
              <h2 className="text-2xl">¿Encaja contigo?</h2>
              <p className="text-tinta-2">{rol === "empresa" ? "Las empresas ven el puntaje de cada persona en sus candidaturas." : "Entra o crea tu cuenta gratis y te explicamos, punto por punto, por qué encaja o qué falta."}</p>
              {!rol && (
                <div className="flex flex-wrap gap-3">
                  <Link to={`/ingresar?volver=/vacantes/${v.id}`} className="btn btn-accion">Entrar para postularme</Link>
                  <Link to="/registro?rol=persona" className="btn btn-claro">Crear cuenta</Link>
                </div>
              )}
            </div>
          )}
          {rol === "persona" && (
            <div className="tarjeta grid gap-3">
              {actionData?.error && <p role="alert" className="error-campo">{actionData.error}</p>}
              {postulacion && postulacion.estado !== "retirada" ? (
                <>
                  <p className="font-bold">Ya te postulaste. Estado: {ESTADOS_POSTULACION[postulacion.estado]}.</p>
                  <Link to="/persona/postulaciones" className="btn btn-claro">Ver mis postulaciones</Link>
                </>
              ) : puedePostular ? (
                <Form method="post">
                  <button className="btn btn-accion btn-grande w-full" disabled={enviando}>{enviando ? "Enviando…" : postulacion ? "Postularme de nuevo" : "Postularme"}</button>
                  <p className="ayuda mt-2">La empresa verá tu puntaje y tus competencias. Tus ajustes solo si lo autorizaste en tu perfil.</p>
                </Form>
              ) : null}
            </div>
          )}
          <p className="ayuda">Publicada el {fecha(v.creada_en)}.</p>
        </aside>
      </div>
    </div>
  );
}
