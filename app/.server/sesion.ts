import argon2 from "argon2";
import { createCookieSessionStorage, redirect } from "react-router";
import { q1 } from "./db";

export type Rol = "persona" | "empresa" | "tecnico";
export interface Usuario {
  id: number;
  rol: Rol;
  nombre: string;
  email: string;
  es_demo: boolean;
}

const produccion = process.env.NODE_ENV === "production";
const secreto = process.env.SESSION_SECRET;
if (produccion && (!secreto || secreto.length < 32)) {
  throw new Error("Falta SESSION_SECRET (mínimo 32 caracteres) en el entorno de producción.");
}

export const almacen = createCookieSessionStorage<{ uid: number }, { aviso: string }>({
  cookie: {
    name: "__it_sesion",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: produccion && process.env.COOKIE_SECURE !== "0",
    secrets: [secreto ?? "solo-desarrollo-local-no-usar-en-produccion"],
    maxAge: 60 * 60 * 24 * 30,
  },
});

export async function usuarioActual(request: Request): Promise<Usuario | null> {
  const sesion = await almacen.getSession(request.headers.get("Cookie"));
  const uid = sesion.get("uid");
  if (!uid) return null;
  const u = await q1<Usuario>("select id, rol, nombre, email, es_demo from usuarios where id = $1", [uid]);
  return u ?? null;
}

export async function requerirUsuario(request: Request, rol?: Rol): Promise<Usuario> {
  const u = await usuarioActual(request);
  if (!u) {
    const url = new URL(request.url);
    throw redirect(`/ingresar?volver=${encodeURIComponent(url.pathname + url.search)}`);
  }
  if (rol && u.rol !== rol) {
    throw redirect(u.rol === "empresa" ? "/empresa" : "/persona");
  }
  return u;
}

export function inicioDe(rol: Rol): string {
  return rol === "empresa" ? "/empresa" : rol === "tecnico" ? "/vacantes" : "/persona";
}

export async function iniciarSesion(request: Request, uid: number, destino: string, aviso?: string) {
  const sesion = await almacen.getSession(request.headers.get("Cookie"));
  sesion.set("uid", uid);
  if (aviso) sesion.flash("aviso", aviso);
  return redirect(destino, { headers: { "Set-Cookie": await almacen.commitSession(sesion) } });
}

export async function cerrarSesion(request: Request) {
  const sesion = await almacen.getSession(request.headers.get("Cookie"));
  return redirect("/", { headers: { "Set-Cookie": await almacen.destroySession(sesion) } });
}

export async function leerAviso(request: Request): Promise<{ aviso: string | null; cookie: string | null }> {
  const sesion = await almacen.getSession(request.headers.get("Cookie"));
  const aviso = sesion.get("aviso") ?? null;
  return { aviso, cookie: aviso ? await almacen.commitSession(sesion) : null };
}

export async function conAviso(request: Request, destino: string, aviso: string) {
  const sesion = await almacen.getSession(request.headers.get("Cookie"));
  sesion.flash("aviso", aviso);
  return redirect(destino, { headers: { "Set-Cookie": await almacen.commitSession(sesion) } });
}

export function cifrarClave(clave: string) {
  return argon2.hash(clave, { type: argon2.argon2id });
}

// Hash fijo para igualar el tiempo de respuesta cuando el correo no existe.
const HASH_SEÑUELO = "$argon2id$v=19$m=65536,t=3,p=4$H+Qnh21Ad4Nd8JJwdk4DHA$SwVGI0LU8rW6ryUWOA3aZ3FPoEqjmsSSjtiK6nnBOO4";

export async function verificarCredenciales(email: string, clave: string) {
  const u = await q1<Usuario & { password_hash: string }>(
    "select id, rol, nombre, email, es_demo, password_hash from usuarios where email = $1",
    [email.trim().toLowerCase()],
  );
  const ok = await argon2.verify(u?.password_hash ?? HASH_SEÑUELO, clave).catch(() => false);
  return u && ok ? u : null;
}
