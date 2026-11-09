import { Link } from "react-router";
import type { Route } from "./+types/inicio";
import { q, q1 } from "~/.server/db";
import { cargarVacantes } from "~/.server/datos";
import { requerirUsuario } from "~/.server/sesion";
import { cop, ESTADOS_POSTULACION, fecha, MODALIDADES, type EstadoPostulacion } from "~/lib/catalogo";
import { calcularCumplimiento } from "~/lib/cumplimiento";
import { Icono } from "~/components/Icono";
import { Vacio } from "~/components/ui";

export const meta: Route.MetaFunction = () => [{ title: "Panel de empresa — IncluTrabajo IA" }];

export async function loader({ request }: Route.LoaderArgs) {
  const u = await requerirUsuario(request, "empresa");
  const empresa = await q1<{ sector: string; ciudad: string; trabajadores: number; pcd_vinculadas: number }>(
    "select sector, ciudad, trabajadores, pcd_vinculadas from empresas where usuario_id = $1",
    [u.id],
  );
  if (!empresa) throw new Response("Empresa no encontrada", { status: 404 });
  const vacantes = await cargarVacantes({ empresaId: u.id, soloActivas: false });
  const conteos = await q<{ vacante_id: number; total: number; nuevas: number }>(
    `select vacante_id, count(*)::int as total, count(*) filter (where estado = 'postulada')::int as nuevas
       from postulaciones where vacante_id = any($1::int[]) and estado <> 'retirada' group by vacante_id`,
    [vacantes.map((v) => v.id)],
  );
  const recientes = await q<{ id: number; nombre: string; cargo: string; vacante_id: number; estado: EstadoPostulacion; creada_en: string }>(
    `select p.id, us.nombre, v.cargo, v.id as vacante_id, p.estado, p.creada_en::text
       from postulaciones p join vacantes v on v.id = p.vacante_id join usuarios us on us.id = p.persona_id
      where v.empresa_id = $1 and p.estado <> 'retirada' order by p.creada_en desc limit 5`,
    [u.id],
  );
  return {
    nombre: u.nombre,
    empresa,
    cumplimiento: calcularCumplimiento({ trabajadores: empresa.trabajadores, vinculadas: empresa.pcd_vinculadas }),
    vacantes: vacantes.map((v) => ({
      id: v.id, cargo: v.cargo, ciudad: v.ciudad, modalidad: v.modalidad, salario: v.salario, activa: v.activa, iap: v.iap,
      verificados: v.ajustes.filter((a) => a.estado === "verificado").length, ajustes: v.ajustes.length,
      postulantes: conteos.find((c) => c.vacante_id === v.id)?.total ?? 0,
      nuevas: conteos.find((c) => c.vacante_id === v.id)?.nuevas ?? 0,
    })),
    recientes,
  };
}

export default function InicioEmpresa({ loaderData }: Route.ComponentProps) {
  const { nombre, empresa, cumplimiento: c, vacantes, recientes } = loaderData;
  return (
    <div className="contenedor py-8 md:py-12 grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="titulo-pagina">{nombre}</h1>
          <p className="subtitulo">{empresa.sector} · {empresa.ciudad} · <span className="num">{empresa.trabajadores}</span> trabajadores</p>
        </div>
        <Link to="/empresa/vacantes/nueva" className="btn btn-accion btn-grande"><Icono nombre="mas" className="size-5" /> Publicar vacante</Link>
      </div>

      <section className="tarjeta tarjeta-grande grid gap-5 md:grid-cols-[1.1fr_1fr_1fr] md:items-center" aria-labelledby="titulo-cuota">
        <div className="grid gap-2">
          <h2 id="titulo-cuota" className="text-3xl">Tu cuota de la Ley 2466</h2>
          <p className="text-tinta-2">
            {c.obligada
              ? c.cumple ? "Cumples la cuota. Sigue contratando bien y acompaña a quien ya está." : `Te faltan ${c.brecha} ${c.brecha === 1 ? "persona" : "personas"} con discapacidad certificada para cumplir.`
              : "Con menos de 100 trabajadores no estás obligada, pero sí puedes deducir el 200 % de sus salarios en renta."}
          </p>
          <Link to="/empresa/cumplimiento" className="enlace w-fit">Ver cálculo y reporte</Link>
        </div>
        <p className="rounded-3xl bg-suelo p-5">
          <span className="block ayuda font-bold">Vinculadas / cuota</span>
          <span className="text-5xl font-black num tracking-tight">{c.vinculadas}<span className="text-tinta-2"> / {c.cuota}</span></span>
        </p>
        <p className="rounded-3xl bg-suelo p-5">
          <span className="block ayuda font-bold">Ahorro en renta al año al cumplir la cuota</span>
          <span className="text-3xl font-black num tracking-tight">{cop(c.ahorroAnual)}</span>
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="grid gap-4" aria-labelledby="titulo-vacantes">
          <h2 id="titulo-vacantes" className="text-3xl">Tus vacantes</h2>
          {vacantes.length === 0 ? (
            <Vacio titulo="Aún no has publicado vacantes" accion={<Link to="/empresa/vacantes/nueva" className="btn btn-accion">Publicar la primera</Link>}>
              Publícala con su checklist de accesibilidad y verás candidaturas ordenadas por compatibilidad.
            </Vacio>
          ) : (
            <ul className="grid gap-4" role="list">
              {vacantes.map((v) => (
                <li key={v.id} className="tarjeta grid gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl">{v.cargo}</h3>
                      <p className="text-tinta-2">{v.ciudad} · {MODALIDADES[v.modalidad]} · <span className="num">{cop(v.salario)}</span></p>
                    </div>
                    <span className={`estado ${v.activa ? "estado-neutro" : "estado-neutro opacity-80"}`}>{v.activa ? "Abierta" : "Cerrada"}</span>
                  </div>
                  <dl className="grid grid-cols-3 divide-x-2 divide-filete border-y-2 border-filete py-3">
                    <div className="pe-3"><dt className="ayuda font-bold flex items-center gap-1.5"><Icono nombre="persona" className="size-4" /> Candidaturas</dt><dd className="text-2xl font-black num">{v.postulantes}{v.nuevas ? <span className="text-base font-bold"> · {v.nuevas} {v.nuevas === 1 ? "nueva" : "nuevas"}</span> : null}</dd></div>
                    <div className="px-3"><dt className="ayuda font-bold flex items-center gap-1.5"><Icono nombre="sello" className="size-4" /> Verificados</dt><dd className="text-2xl font-black num">{v.verificados}<span className="text-tinta-2"> de {v.ajustes}</span></dd></div>
                    <div className="ps-3"><dt className="ayuda font-bold flex items-center gap-1.5"><Icono nombre="accesibilidad" className="size-4" /> Índice</dt><dd className="text-2xl font-black num">{v.iap ? v.iap.valor : "—"}{v.iap ? <span className="text-base font-bold text-tinta-2"> · {v.iap.categoria}</span> : null}</dd></div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <Link to={`/empresa/vacantes/${v.id}/candidaturas`} className="btn btn-accion">Ver candidaturas</Link>
                    <Link to={`/empresa/vacantes/${v.id}`} className="btn btn-claro"><Icono nombre="lapiz" className="size-5" /> Editar</Link>
                    <Link to={`/vacantes/${v.id}`} className="enlace">Ver como la ven las personas</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="tarjeta tarjeta-grande grid gap-4 content-start self-start" aria-labelledby="titulo-recientes">
          <h2 id="titulo-recientes" className="text-2xl">Candidaturas recientes</h2>
          {recientes.length === 0 ? (
            <p className="text-tinta-2">Cuando alguien se postule, aparecerá aquí.</p>
          ) : (
            <ul className="grid gap-3" role="list">
              {recientes.map((r) => (
                <li key={r.id}>
                  <Link to={`/empresa/vacantes/${r.vacante_id}/candidaturas`} className="tarjeta-tocable block rounded-3xl bg-suelo p-4">
                    <span className="block font-black">{r.nombre}</span>
                    <span className="block text-tinta-2">{r.cargo} · {fecha(r.creada_en)}</span>
                    <span className="block font-bold mt-1">{ESTADOS_POSTULACION[r.estado]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
