import { useState } from "react";
import { data, Form, Link, redirect, useNavigation } from "react-router";
import { z } from "zod";
import type { Route } from "./+types/registro";
import { db, q1 } from "~/.server/db";
import { avisar } from "~/.server/datos";
import { cifrarClave, iniciarSesion, inicioDe, usuarioActual } from "~/.server/sesion";
import { exigirMismoOrigen, ipDe, permitirIntento } from "~/.server/seguridad";
import { Icono } from "~/components/Icono";
import { Campo, ErroresFormulario } from "~/components/ui";

export const meta: Route.MetaFunction = () => [{ title: "Crear cuenta — IncluTrabajo IA" }];

export async function loader({ request }: Route.LoaderArgs) {
  const u = await usuarioActual(request);
  if (u) throw redirect(inicioDe(u.rol));
  const rol = new URL(request.url).searchParams.get("rol");
  return { rol: rol === "empresa" ? "empresa" : "persona" };
}

const esquema = z.object({
  rol: z.enum(["persona", "empresa"], { message: "Elige si buscas empleo o contratas talento." }),
  nombre: z.string().trim().min(2, "Escribe tu nombre completo.").max(150, "El nombre es muy largo."),
  email: z.string().trim().toLowerCase().email("Escribe un correo válido, por ejemplo nombre@correo.com."),
  clave: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(200),
  ciudad: z.string().trim().min(2, "Escribe tu ciudad.").max(100),
  sector: z.string().trim().max(100).optional(),
  trabajadores: z.coerce.number().int().min(0).max(1_000_000).optional(),
  terminos: z.literal("si", { message: "Para crear la cuenta debes aceptar la política de privacidad." }),
  comparte: z.string().optional(),
});

export async function action({ request }: Route.ActionArgs) {
  exigirMismoOrigen(request);
  if (!permitirIntento(`registro:${ipDe(request)}`)) {
    return data({ errores: { email: "Hiciste muchos registros seguidos. Espera unos minutos." } as Record<string, string>, valores: {} as Record<string, string> }, { status: 429 });
  }
  const form = await request.formData();
  const valores = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])) as Record<string, string>;
  delete valores.clave;
  const r = esquema.safeParse(Object.fromEntries(form));
  if (!r.success) {
    const errores: Record<string, string> = {};
    for (const i of r.error.issues) errores[String(i.path[0])] ??= i.message;
    return data({ errores, valores }, { status: 400 });
  }
  const d = r.data;
  if (d.rol === "empresa" && (!d.sector || d.sector.length < 2)) {
    return data({ errores: { sector: "Escribe el sector de la empresa, por ejemplo «comercio»." } as Record<string, string>, valores }, { status: 400 });
  }
  if (await q1("select 1 from usuarios where email = $1", [d.email])) {
    return data({ errores: { email: "Ya hay una cuenta con ese correo. Puedes entrar con él." } as Record<string, string>, valores }, { status: 409 });
  }
  const hash = await cifrarClave(d.clave);
  const id = await (await db()).tx(async (t) => {
    const [u] = await t.query<{ id: number }>(
      "insert into usuarios (rol, nombre, email, password_hash) values ($1, $2, $3, $4) returning id",
      [d.rol, d.nombre, d.email, hash],
    );
    if (d.rol === "persona") {
      // La autorización de datos sensibles es opcional y separada (Ley 1581 de 2012, art. 6).
      const comparte = d.comparte === "si";
      await t.query("insert into personas (usuario_id, ciudad, comparte_ajustes, comparte_desde) values ($1, $2, $3, $4)", [
        u.id, d.ciudad, comparte, comparte ? new Date() : null,
      ]);
      await avisar(t, u.id, "Bienvenida a IncluTrabajo IA", "Cuéntanos qué sabes hacer y qué ajustes necesitas para ver tus primeras coincidencias.", "/persona/perfil");
    } else {
      await t.query("insert into empresas (usuario_id, sector, ciudad, trabajadores) values ($1, $2, $3, $4)", [u.id, d.sector, d.ciudad, d.trabajadores ?? 0]);
      await avisar(t, u.id, "Bienvenida a IncluTrabajo IA", "Publica tu primera vacante con su checklist de accesibilidad.", "/empresa/vacantes/nueva");
    }
    return u.id;
  });
  return iniciarSesion(request, id, d.rol === "persona" ? "/persona/perfil" : "/empresa", "Tu cuenta está lista.");
}

export default function Registro({ loaderData, actionData }: Route.ComponentProps) {
  const [rol, setRol] = useState<"persona" | "empresa">((actionData?.valores?.rol as any) ?? loaderData.rol);
  const errores = actionData?.errores;
  const v = actionData?.valores ?? {};
  const enviando = useNavigation().state === "submitting";
  return (
    <div className="contenedor py-10 md:py-16 grid gap-8 max-w-3xl">
      <div>
        <h1 className="titulo-pagina">Crea tu cuenta</h1>
        <p className="subtitulo mt-2">Tarda unos 2 minutos. Para las personas es gratis, siempre.</p>
      </div>
      <ErroresFormulario errores={errores} />
      <Form method="post" className="grid gap-8" noValidate>
        <fieldset className="grid gap-3">
          <legend className="etiqueta mb-2 text-xl">¿Qué quieres hacer?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ["persona", "Busco empleo", "Soy una persona que busca trabajo.", "persona"],
              ["empresa", "Contrato talento", "Represento a una empresa o entidad.", "edificio"],
            ] as const).map(([valor, titulo, texto, icono]) => (
              <label key={valor} className="opcion !items-start !p-5 !rounded-tarjeta">
                <input type="radio" name="rol" value={valor} checked={rol === valor} onChange={() => setRol(valor)} className="mt-1" />
                <span className="grid gap-1">
                  <span className="flex items-center gap-2 text-xl font-black"><Icono nombre={icono} /> {titulo}</span>
                  <span className="text-tinta-2 font-normal">{texto}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="tarjeta tarjeta-grande grid gap-5">
          <Campo etiqueta={rol === "empresa" ? "Nombre de la empresa" : "Tu nombre completo"} error={errores?.nombre}>
            {(p) => <input {...p} name="nombre" autoComplete={rol === "empresa" ? "organization" : "name"} className="entrada" defaultValue={v.nombre} required />}
          </Campo>
          <Campo etiqueta="Correo" ayuda="Lo usas para entrar. No lo compartimos." error={errores?.email}>
            {(p) => <input {...p} name="email" type="email" autoComplete="email" inputMode="email" className="entrada" defaultValue={v.email} required />}
          </Campo>
          <Campo etiqueta="Contraseña" ayuda="Mínimo 8 caracteres. Puede ser una frase que recuerdes." error={errores?.clave}>
            {(p) => <input {...p} name="clave" type="password" autoComplete="new-password" className="entrada" minLength={8} required />}
          </Campo>
          <Campo etiqueta="Ciudad" error={errores?.ciudad}>
            {(p) => <input {...p} name="ciudad" autoComplete="address-level2" className="entrada" defaultValue={v.ciudad} required />}
          </Campo>
          {rol === "empresa" && (
            <>
              <Campo etiqueta="Sector" ayuda="Por ejemplo: comercio, hotelería, tecnología." error={errores?.sector}>
                {(p) => <input {...p} name="sector" className="entrada" defaultValue={v.sector} />}
              </Campo>
              <Campo etiqueta="Trabajadores de planta" ayuda="Lo usamos para calcular tu cuota de la Ley 2466." opcional>
                {(p) => <input {...p} name="trabajadores" type="number" min={0} inputMode="numeric" className="entrada num" defaultValue={v.trabajadores} />}
              </Campo>
            </>
          )}
        </div>

        <fieldset className="tarjeta tarjeta-grande grid gap-4">
          <legend className="sr-only">Permisos</legend>
          {rol === "persona" && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="comparte" value="si" defaultChecked={v.comparte === "si"} className="mt-1" />
              <span>
                <strong>Opcional:</strong> autorizo mostrar los ajustes que necesito a las empresas a las que me postule.
                <span className="block ayuda mt-1">Puedes crear la cuenta sin esto y cambiarlo cuando quieras en tu perfil. Sin tu permiso, la empresa ve tu puntaje pero no tus ajustes.</span>
              </span>
            </label>
          )}
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" name="terminos" value="si" aria-describedby={errores?.terminos ? "error-terminos" : undefined} className="mt-1" />
            <span>
              Acepto la <Link to="/privacidad" className="enlace">política de privacidad y tratamiento de datos</Link>.
            </span>
          </label>
          {errores?.terminos && <p id="error-terminos" className="error-campo">{errores.terminos}</p>}
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-accion btn-grande" disabled={enviando}>{enviando ? "Creando…" : "Crear mi cuenta"}</button>
          <p className="text-tinta-2">¿Ya tienes cuenta? <Link to="/ingresar" className="enlace">Entrar</Link></p>
        </div>
      </Form>
    </div>
  );
}
