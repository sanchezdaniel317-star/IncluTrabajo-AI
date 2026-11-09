import { data, Form, useNavigation } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/cumplimiento";
import { q, q1 } from "~/.server/db";
import { conAviso, requerirUsuario } from "~/.server/sesion";
import { exigirMismoOrigen } from "~/.server/seguridad";
import { cop, fecha } from "~/lib/catalogo";
import { calcularCumplimiento, PARAMETROS_2026 } from "~/lib/cumplimiento";
import { Campo, ErroresFormulario } from "~/components/ui";

export const meta: Route.MetaFunction = () => [{ title: "Cuota y beneficios — IncluTrabajo IA" }];

export async function loader({ request }: Route.LoaderArgs) {
  const u = await requerirUsuario(request, "empresa");
  const e = await q1<{ trabajadores: number; pcd_vinculadas: number; sector: string; ciudad: string }>(
    "select trabajadores, pcd_vinculadas, sector, ciudad from empresas where usuario_id = $1",
    [u.id],
  );
  if (!e) throw new Response("Empresa no encontrada", { status: 404 });
  const contratadas = await q<{ nombre: string; cargo: string; desde: string }>(
    `select us.nombre, v.cargo, p.actualizada_en::text as desde from postulaciones p
       join vacantes v on v.id = p.vacante_id join usuarios us on us.id = p.persona_id
      where v.empresa_id = $1 and p.estado = 'contratada' order by p.actualizada_en desc`,
    [u.id],
  );
  const url = new URL(request.url);
  const salario = Number(url.searchParams.get("salario")) || PARAMETROS_2026.smmlv;
  const proporcion = Math.min(100, Math.max(0, Number(url.searchParams.get("proporcion") ?? 70))) / 100;
  return {
    nombre: u.nombre,
    empresa: e,
    salario,
    proporcion,
    calculo: calcularCumplimiento({ trabajadores: e.trabajadores, vinculadas: e.pcd_vinculadas, salario, proporcionElegible: proporcion }),
    contratadas,
    hoy: new Date().toISOString(),
  };
}

const esquema = z.object({
  trabajadores: z.coerce.number({ message: "Escribe el número de trabajadores." }).int().min(0).max(1_000_000),
  vinculadas: z.coerce.number({ message: "Escribe cuántas personas con discapacidad tienes vinculadas." }).int().min(0).max(1_000_000),
});

export async function action({ request }: Route.ActionArgs) {
  exigirMismoOrigen(request);
  const u = await requerirUsuario(request, "empresa");
  const form = await request.formData();
  const r = esquema.safeParse({ trabajadores: form.get("trabajadores"), vinculadas: form.get("vinculadas") });
  if (!r.success) {
    const errores: Record<string, string> = {};
    for (const i of r.error.issues) errores[String(i.path[0])] ??= i.message;
    return data({ errores }, { status: 400 });
  }
  await q("update empresas set trabajadores = $1, pcd_vinculadas = $2 where usuario_id = $3", [r.data.trabajadores, r.data.vinculadas, u.id]);
  return conAviso(request, "/empresa/cumplimiento", "Actualizamos los datos de tu planta.");
}

export default function Cumplimiento({ loaderData, actionData }: Route.ComponentProps) {
  const { nombre, empresa, calculo: c, salario, proporcion, contratadas, hoy } = loaderData;
  const enviando = useNavigation().state === "submitting";
  return (
    <div className="contenedor py-8 md:py-12 grid gap-8 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="titulo-pagina">Cuota y beneficios</h1>
          <p className="subtitulo">Ley 2466 de 2025 y Ley 361 de 1997. Corte al {fecha(hoy)}.</p>
        </div>
        <button type="button" className="btn btn-claro no-imprimir js-solo" onClick={() => window.print()}>Imprimir o guardar en PDF</button>
      </div>

      <section className="tarjeta tarjeta-grande grid gap-6" aria-labelledby="t-resumen">
        <h2 id="t-resumen" className="text-3xl">{nombre}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-suelo p-5"><p className="ayuda font-bold">Cuota exigida</p><p className="text-5xl font-black num">{c.cuota}</p><p className="text-tinta-2">{c.obligada ? "personas con discapacidad certificada" : "No está obligada"}</p></div>
          <div className="rounded-3xl bg-suelo p-5"><p className="ayuda font-bold">Vinculadas hoy</p><p className="text-5xl font-black num">{c.vinculadas}</p><p className="text-tinta-2">{c.cumple ? "Cumple la cuota" : `Faltan ${c.brecha}`}</p></div>
          <div className="rounded-3xl bg-suelo p-5"><p className="ayuda font-bold">Ahorro en renta al año</p><p className="text-3xl font-black num mt-2">{cop(c.ahorroAnual)}</p><p className="text-tinta-2">estimado, con la cuota cumplida</p></div>
        </div>
        <div className="grid gap-2 text-lg max-w-[70ch]">
          <p><strong>Cómo calculamos la cuota:</strong> 2 personas por cada 100 trabajadores en empresas de 100 a 500, y 1 más por cada 100 adicionales. Es una interpretación preliminar mientras sale el decreto reglamentario; solo cuentan personas con certificado de discapacidad (Resolución 1197 de 2024).</p>
          <p><strong>Cómo calculamos el ahorro:</strong> la deducción del 200 % de salarios y prestaciones (Ley 361, art. 31) aplica a personas con limitación certificada de al menos 25 %. Usamos {cop(salario)} de salario, {Math.round(proporcion * 100)} % de personas que cumplen ese requisito y tarifa de renta del 35 %. Base anual por persona: {cop(c.basePorPersona)}.</p>
          <p className="ayuda">Esto es una estimación para planear. Confírmala con tu contador.</p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 no-imprimir">
        <section className="tarjeta tarjeta-grande grid gap-4" aria-labelledby="t-planta">
          <h2 id="t-planta" className="text-2xl">Datos de tu planta</h2>
          <ErroresFormulario errores={actionData?.errores} />
          <Form method="post" className="grid gap-4">
            <Campo etiqueta="Trabajadores de planta" ayuda="Permanentes; no cuentes contratistas ni temporales." error={actionData?.errores?.trabajadores}>
              {(p) => <input {...p} name="trabajadores" type="number" min={0} inputMode="numeric" className="entrada num" defaultValue={empresa.trabajadores} />}
            </Campo>
            <Campo etiqueta="Personas con discapacidad certificada vinculadas" error={actionData?.errores?.vinculadas}>
              {(p) => <input {...p} name="vinculadas" type="number" min={0} inputMode="numeric" className="entrada num" defaultValue={empresa.pcd_vinculadas} />}
            </Campo>
            <button className="btn btn-accion" disabled={enviando}>Guardar</button>
          </Form>
        </section>
        <section className="tarjeta tarjeta-grande grid gap-4" aria-labelledby="t-supuestos">
          <h2 id="t-supuestos" className="text-2xl">Ajusta los supuestos del ahorro</h2>
          <Form method="get" className="grid gap-4">
            <Campo etiqueta="Salario mensual promedio de las personas vinculadas">
              {(p) => <input {...p} name="salario" type="number" min={0} step={1000} inputMode="numeric" className="entrada num" defaultValue={salario} />}
            </Campo>
            <Campo etiqueta="Porcentaje con limitación certificada de al menos 25 %">
              {(p) => <input {...p} name="proporcion" type="number" min={0} max={100} inputMode="numeric" className="entrada num" defaultValue={Math.round(proporcion * 100)} />}
            </Campo>
            <button className="btn btn-claro">Recalcular</button>
          </Form>
        </section>
      </div>

      <section className="tarjeta tarjeta-grande grid gap-4" aria-labelledby="t-contratadas">
        <h2 id="t-contratadas" className="text-2xl">Contratadas por IncluTrabajo IA</h2>
        {contratadas.length === 0 ? (
          <p className="text-tinta-2">Aún no hay contrataciones registradas desde la plataforma.</p>
        ) : (
          <table className="w-full text-left">
            <caption className="sr-only">Personas contratadas</caption>
            <thead><tr><th scope="col" className="py-2">Persona</th><th scope="col" className="py-2">Cargo</th><th scope="col" className="py-2">Desde</th></tr></thead>
            <tbody>
              {contratadas.map((x, i) => (
                <tr key={i} className="border-t border-filete"><td className="py-2 font-semibold">{x.nombre}</td><td className="py-2">{x.cargo}</td><td className="py-2 num">{fecha(x.desde)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
