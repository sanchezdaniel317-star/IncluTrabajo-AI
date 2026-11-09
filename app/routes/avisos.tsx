import { Form, Link } from "react-router";
import type { Route } from "./+types/avisos";
import { q } from "~/.server/db";
import { requerirUsuario } from "~/.server/sesion";
import { destinoSeguro, exigirMismoOrigen } from "~/.server/seguridad";
import { redirect } from "react-router";
import { fecha } from "~/lib/catalogo";
import { Icono } from "~/components/Icono";
import { Vacio } from "~/components/ui";

export const meta: Route.MetaFunction = () => [{ title: "Avisos — IncluTrabajo IA" }];

export async function loader({ request }: Route.LoaderArgs) {
  const u = await requerirUsuario(request);
  const avisos = await q<{ id: number; titulo: string; mensaje: string; url: string | null; leido: boolean; creado_en: string }>(
    "select id, titulo, mensaje, url, leido, creado_en::text from avisos where usuario_id = $1 order by creado_en desc limit 50",
    [u.id],
  );
  return { avisos };
}

export async function action({ request }: Route.ActionArgs) {
  exigirMismoOrigen(request);
  const u = await requerirUsuario(request);
  const form = await request.formData();
  if (form.get("todos") === "si") {
    await q("update avisos set leido = true where usuario_id = $1", [u.id]);
    return redirect("/avisos");
  }
  const id = Number(form.get("abrir"));
  const [a] = await q<{ url: string | null }>("update avisos set leido = true where id = $1 and usuario_id = $2 returning url", [id, u.id]);
  return redirect(destinoSeguro(a?.url, "/avisos"));
}

export default function Avisos({ loaderData }: Route.ComponentProps) {
  const { avisos } = loaderData;
  const sinLeer = avisos.filter((a) => !a.leido).length;
  return (
    <div className="contenedor py-8 md:py-12 grid gap-8 max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="titulo-pagina">Avisos</h1>
          <p className="subtitulo">{sinLeer === 0 ? "Estás al día." : `${sinLeer} sin leer.`}</p>
        </div>
        {sinLeer > 0 && (
          <Form method="post"><button className="btn btn-claro" name="todos" value="si">Marcar todos como leídos</button></Form>
        )}
      </div>
      {avisos.length === 0 ? (
        <Vacio titulo="No tienes avisos" accion={<Link to="/" className="btn btn-claro">Ir al inicio</Link>}>Te avisaremos cuando cambie una postulación o haya algo nuevo para ti.</Vacio>
      ) : (
        <Form method="post">
          <ul className="grid gap-3" role="list">
            {avisos.map((a) => (
              <li key={a.id}>
                <button name="abrir" value={a.id} className={`tarjeta tarjeta-tocable w-full text-left grid grid-cols-[auto_1fr_auto] gap-4 items-start ${a.leido ? "opacity-90" : ""}`}>
                  <span className={`marca ${a.leido ? "marca-sin_datos" : "marca-si"} size-10`}><Icono nombre="campana" className="size-5" /></span>
                  <span className="min-w-0">
                    <span className="block text-xl font-black leading-tight">{a.titulo}{!a.leido && <span className="sr-only"> (sin leer)</span>}</span>
                    <span className="block text-tinta-2 mt-1">{a.mensaje}</span>
                    <span className="block ayuda mt-1 num">{fecha(a.creado_en)}</span>
                  </span>
                  <Icono nombre="flecha" className="size-6 mt-1" />
                </button>
              </li>
            ))}
          </ul>
        </Form>
      )}
    </div>
  );
}
