import { Link } from "react-router";
import type { Route } from "./+types/inicio";
import { q } from "~/.server/db";
import { cargarPersona, cargarVacantes } from "~/.server/datos";
import { requerirUsuario } from "~/.server/sesion";
import { ESTADOS_POSTULACION, MODALIDADES, type EstadoPostulacion } from "~/lib/catalogo";
import { emparejar } from "~/lib/matching";
import { Icono } from "~/components/Icono";
import { Anillo } from "~/components/ui";

export const meta: Route.MetaFunction = () => [{ title: "Inicio — IncluTrabajo IA" }];

export async function loader({ request }: Route.LoaderArgs) {
  const u = await requerirUsuario(request, "persona");
  const persona = await cargarPersona(u.id);
  if (!persona) throw new Response("Perfil no encontrado", { status: 404 });
  const vacantes = await cargarVacantes();
  const top = vacantes
    .map((v) => ({ id: v.id, cargo: v.cargo, empresa: v.empresa, lugar: `${v.ciudad} · ${MODALIDADES[v.modalidad]}`, r: emparejar(persona, v) }))
    .sort((a, b) => Number(b.r.compatible) - Number(a.r.compatible) || b.r.puntaje - a.r.puntaje)
    .slice(0, 3);
  const postulaciones = await q<{ id: number; cargo: string; empresa: string; estado: EstadoPostulacion }>(
    `select p.id, v.cargo, us.nombre as empresa, p.estado from postulaciones p
       join vacantes v on v.id = p.vacante_id join usuarios us on us.id = v.empresa_id
      where p.persona_id = $1 order by p.actualizada_en desc limit 3`,
    [u.id],
  );
  const pasos = [
    { hecho: persona.competencias.length > 0, texto: "Cuéntanos qué sabes hacer", a: "/persona/perfil#competencias" },
    { hecho: persona.salario_min > 0, texto: "Di cuánto esperas ganar", a: "/persona/perfil#preferencias" },
    { hecho: persona.ajustes.length > 0 || Object.keys(persona.dominios).length > 0, texto: "Marca los ajustes que necesitas (si necesitas alguno)", a: "/persona/perfil#ajustes" },
  ];
  const completos = pasos.filter((p) => p.hecho).length;
  return { nombre: persona.nombre.split(" ")[0], top, postulaciones, pasos, completos };
}

export default function InicioPersona({ loaderData }: Route.ComponentProps) {
  const { nombre, top, postulaciones, pasos, completos } = loaderData;
  const siguiente = pasos.find((p) => !p.hecho);
  return (
    <div className="contenedor py-8 md:py-12 grid gap-8">
      <div className="grid gap-2">
        <h1 className="titulo-pagina">Hola, {nombre}.</h1>
        <p className="subtitulo">Tu perfil está {completos === pasos.length ? "completo" : `${completos} de ${pasos.length} pasos`}. {siguiente ? "Con un paso más verás coincidencias más precisas." : "Ya puedes ver todas tus coincidencias."}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <section className="tarjeta tarjeta-grande grid gap-5" aria-labelledby="titulo-top">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="titulo-top" className="text-3xl">Lo que más encaja contigo</h2>
            <Link to="/persona/coincidencias" className="enlace">Ver todas</Link>
          </div>
          <ul className="grid gap-3" role="list">
            {top.map((t) => (
              <li key={t.id}>
                <Link to={`/vacantes/${t.id}`} className="tarjeta-tocable flex items-center gap-4 rounded-3xl bg-suelo p-4">
                  <Anillo puntaje={t.r.puntaje} tamano={68} etiqueta={`${t.r.puntaje} de 100, ${t.r.etiqueta}`} />
                  <span className="min-w-0 grow">
                    <span className="block text-xl font-black leading-tight">{t.cargo}</span>
                    <span className="block text-tinta-2">{t.empresa} · {t.lugar}</span>
                    <span className="block font-bold mt-1">{t.r.etiqueta}</span>
                  </span>
                  <Icono nombre="flecha" className="size-6 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-6 content-start">
          {siguiente && (
            <section className="tarjeta tarjeta-grande grid gap-4" aria-labelledby="titulo-siguiente">
              <h2 id="titulo-siguiente" className="text-2xl">Tu siguiente paso</h2>
              <p className="text-xl font-bold">{siguiente.texto}</p>
              <Link to={siguiente.a} className="btn btn-accion">Hacerlo ahora <Icono nombre="flecha" className="size-5" /></Link>
              <ol className="grid gap-2 mt-1" role="list">
                {pasos.map((p) => (
                  <li key={p.texto} className="flex items-center gap-3">
                    <span className={`marca ${p.hecho ? "marca-si" : "marca-sin_datos"} size-8`}>
                      <Icono nombre={p.hecho ? "check" : "guion"} className="size-4" />
                    </span>
                    <span className={p.hecho ? "text-tinta-2 line-through decoration-2" : "font-semibold"}>{p.texto}</span>
                    <span className="sr-only">{p.hecho ? "hecho" : "pendiente"}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <section className="tarjeta tarjeta-grande grid gap-4" aria-labelledby="titulo-post">
            <div className="flex items-end justify-between gap-3">
              <h2 id="titulo-post" className="text-2xl">Tus postulaciones</h2>
              <Link to="/persona/postulaciones" className="enlace">Ver</Link>
            </div>
            {postulaciones.length === 0 ? (
              <p className="text-tinta-2">Aún no te has postulado. Cuando lo hagas, aquí verás en qué va cada una.</p>
            ) : (
              <ul className="grid gap-3" role="list">
                {postulaciones.map((p) => (
                  <li key={p.id} className="rounded-3xl bg-suelo p-4">
                    <p className="font-black leading-tight">{p.cargo}</p>
                    <p className="text-tinta-2">{p.empresa}</p>
                    <p className="font-bold mt-1">{ESTADOS_POSTULACION[p.estado]}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
