import { data, Form, Link, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/ingresar";
import { q, q1 } from "~/.server/db";
import { iniciarSesion, inicioDe, usuarioActual, verificarCredenciales, type Rol } from "~/.server/sesion";
import { destinoSeguro, exigirMismoOrigen, ipDe, limpiarIntentos, permitirIntento } from "~/.server/seguridad";
import { Icono } from "~/components/Icono";
import { Campo, ErroresFormulario } from "~/components/ui";

export const meta: Route.MetaFunction = () => [{ title: "Entrar — IncluTrabajo IA" }];

export async function loader({ request }: Route.LoaderArgs) {
  const u = await usuarioActual(request);
  if (u) throw redirect(inicioDe(u.rol));
  const demos = await q<{ id: number; nombre: string; rol: Rol; email: string }>(
    "select id, nombre, rol, email from usuarios where es_demo order by rol desc, id",
  );
  return { demos, volver: new URL(request.url).searchParams.get("volver") ?? "" };
}

export async function action({ request }: Route.ActionArgs) {
  exigirMismoOrigen(request);
  const form = await request.formData();
  const volver = form.get("volver");

  const demoId = Number(form.get("demo"));
  if (demoId) {
    const u = await q1<{ id: number; rol: Rol; nombre: string }>("select id, rol, nombre from usuarios where id = $1 and es_demo", [demoId]);
    if (!u) return data({ errores: { demo: "Esa cuenta de demostración no está disponible." } as Record<string, string>, email: "" }, { status: 400 });
    return iniciarSesion(request, u.id, destinoSeguro(volver, inicioDe(u.rol)), `Entraste como ${u.nombre} (cuenta de demostración).`);
  }

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const clave = String(form.get("clave") ?? "");
  const errores: Record<string, string> = {};
  if (!email) errores.email = "Escribe tu correo.";
  if (!clave) errores.clave = "Escribe tu contraseña.";
  if (Object.keys(errores).length) return data({ errores, email }, { status: 400 });

  const llave = `${ipDe(request)}:${email}`;
  if (!permitirIntento(llave)) {
    return data({ errores: { email: "Hiciste muchos intentos. Espera 10 minutos e inténtalo de nuevo." } as Record<string, string>, email }, { status: 429 });
  }
  const u = await verificarCredenciales(email, clave);
  if (!u) return data({ errores: { clave: "El correo o la contraseña no coinciden." } as Record<string, string>, email }, { status: 401 });
  limpiarIntentos(llave);
  return iniciarSesion(request, u.id, destinoSeguro(volver, inicioDe(u.rol)));
}

export default function Ingresar({ loaderData, actionData }: Route.ComponentProps) {
  const enviando = useNavigation().state === "submitting";
  const errores = actionData?.errores;
  const personas = loaderData.demos.filter((d) => d.rol === "persona");
  const empresas = loaderData.demos.filter((d) => d.rol === "empresa");
  return (
    <div className="contenedor py-10 md:py-16 grid gap-10 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start">
      <section className="tarjeta tarjeta-grande grid gap-6" aria-labelledby="titulo-ingresar">
        <div>
          <h1 id="titulo-ingresar" className="titulo-pagina">Entrar</h1>
          <p className="subtitulo mt-2">Con el correo y la contraseña de tu cuenta.</p>
        </div>
        <ErroresFormulario errores={errores && !errores.demo ? errores : null} />
        <Form method="post" className="grid gap-5" noValidate>
          <input type="hidden" name="volver" value={loaderData.volver} />
          <Campo etiqueta="Correo" error={errores?.email}>
            {(p) => <input {...p} name="email" type="email" autoComplete="email" inputMode="email" className="entrada" defaultValue={actionData?.email ?? ""} required />}
          </Campo>
          <Campo etiqueta="Contraseña" error={errores?.clave}>
            {(p) => <input {...p} name="clave" type="password" autoComplete="current-password" className="entrada" required />}
          </Campo>
          <button type="submit" className="btn btn-accion btn-grande" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
        </Form>
        <p className="text-tinta-2">¿No tienes cuenta? <Link to="/registro" className="enlace">Crear una cuenta gratis</Link></p>
      </section>

      <section className="grid gap-5" aria-labelledby="titulo-demo">
        <div>
          <h2 id="titulo-demo" className="text-3xl">Prueba con una cuenta de demostración</h2>
          <p className="subtitulo mt-1">Personas y empresas ficticias. Contraseña de todas: <strong className="num">Demo2026!</strong></p>
        </div>
        {errores?.demo && <p role="alert" className="error-campo">{errores.demo}</p>}
        <Form method="post" className="grid gap-6">
          <input type="hidden" name="volver" value={loaderData.volver} />
          <fieldset className="grid gap-3">
            <legend className="etiqueta mb-2">Busco empleo</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {personas.map((d) => (
                <button key={d.id} name="demo" value={d.id} className="tarjeta tarjeta-tocable text-left flex items-center gap-4 !p-5" aria-label={`Entrar como ${d.nombre}, persona que busca empleo`}>
                  <span className="size-12 rounded-2xl bg-suelo grid place-items-center shrink-0"><Icono nombre="persona" /></span>
                  <span className="font-bold text-lg leading-tight">{d.nombre}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="grid gap-3">
            <legend className="etiqueta mb-2">Contrato talento</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {empresas.map((d) => (
                <button key={d.id} name="demo" value={d.id} className="tarjeta tarjeta-tocable text-left flex items-center gap-4 !p-5" aria-label={`Entrar como ${d.nombre}, empresa`}>
                  <span className="size-12 rounded-2xl bg-suelo grid place-items-center shrink-0"><Icono nombre="edificio" /></span>
                  <span className="font-bold text-lg leading-tight">{d.nombre}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </Form>
      </section>
    </div>
  );
}
