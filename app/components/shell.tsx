import { Form, Link, NavLink, useLocation } from "react-router";
import type { Preferencias } from "~/lib/preferencias";
import type { Usuario } from "~/.server/sesion";
import { Icono, type NombreIcono } from "./Icono";

type Nav = { a: string; texto: string; icono: NombreIcono; fin?: boolean };

export const NAV_PERSONA: Nav[] = [
  { a: "/persona", texto: "Inicio", icono: "hogar", fin: true },
  { a: "/persona/coincidencias", texto: "Para ti", icono: "check" },
  { a: "/vacantes", texto: "Vacantes", icono: "buscar" },
  { a: "/persona/postulaciones", texto: "Postulaciones", icono: "maletin" },
  { a: "/persona/perfil", texto: "Perfil", icono: "persona" },
];

export const NAV_EMPRESA: Nav[] = [
  { a: "/empresa", texto: "Panel", icono: "hogar", fin: true },
  { a: "/empresa/vacantes/nueva", texto: "Publicar", icono: "mas" },
  { a: "/empresa/cumplimiento", texto: "Cuota", icono: "grafica" },
  { a: "/vacantes", texto: "Vacantes", icono: "buscar" },
  { a: "/avisos", texto: "Avisos", icono: "campana" },
];

export function Marca() {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 rounded-xl no-underline font-black text-[1.1875rem] sm:text-[1.375rem] tracking-tight whitespace-nowrap shrink-0">
      <svg viewBox="0 0 40 40" className="size-9 sm:size-10 shrink-0" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill="var(--color-tinta)" />
        <circle cx="14" cy="13" r="4" fill="var(--color-suelo)" />
        <path d="M8 31c1-6 3.5-9 6-9s4 1.6 5 4M21 31h11V19H21z" fill="none" stroke="var(--color-suelo)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="max-[379px]:sr-only">IncluTrabajo <span className="text-accion">IA</span></span>
    </Link>
  );
}

function opciones<K extends keyof Preferencias>(campo: K, valores: [Preferencias[K], string][], actual: Preferencias[K], leyenda: string) {
  return (
    <fieldset className="grid gap-2">
      <legend className="etiqueta mb-1">{leyenda}</legend>
      <div className="grupo-segmentos">
        {valores.map(([v, t]) => (
          <label key={String(v)} className="segmento">
            <input type="radio" name={campo} value={String(v)} defaultChecked={actual === v} />
            <span>{t}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PanelAccesibilidad({ prefs }: { prefs: Preferencias }) {
  const { pathname, search } = useLocation();
  return (
    <details className="panel-desplegable relative">
      <summary className="btn btn-suave btn-icono md:px-4 md:gap-2" aria-label="Ajustes de lectura y accesibilidad">
        <Icono nombre="accesibilidad" className="size-6" />
        <span className="hidden lg:inline">Accesibilidad</span>
      </summary>
      <div className="absolute right-0 z-50 mt-3 w-[min(92vw,26rem)] tarjeta shadow-[0_24px_60px_-20px_rgb(27_27_31/0.45)] grid gap-5">
        <div>
          <h2 className="text-xl">Ajusta la página a ti</h2>
          <p className="ayuda mt-1">Se guarda en este dispositivo. No necesitas cuenta.</p>
        </div>
        <Form method="post" action="/preferencias" className="grid gap-5" reloadDocument>
          <input type="hidden" name="volver" value={pathname + search} />
          {opciones("texto", [["normal", "Normal"], ["grande", "Grande"], ["enorme", "Muy grande"]], prefs.texto, "Tamaño del texto")}
          {opciones("contraste", [["normal", "Normal"], ["alto", "Alto contraste"]], prefs.contraste, "Colores")}
          {opciones("letra", [["estandar", "Estándar"], ["legible", "Alta legibilidad"]], prefs.letra, "Tipo de letra")}
          {opciones("espaciado", [["normal", "Normal"], ["amplio", "Amplio"]], prefs.espaciado, "Espacio entre letras y líneas")}
          {opciones("movimiento", [["auto", "Con animaciones"], ["reducido", "Sin animaciones"]], prefs.movimiento, "Movimiento")}
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-accion" type="submit">Guardar</button>
            <button className="btn btn-claro" type="submit" name="restablecer" value="1">Restablecer</button>
          </div>
        </Form>
        <Link to="/accesibilidad" className="enlace">Cómo usar la página con lector de pantalla, voz o teclado</Link>
      </div>
    </details>
  );
}

export function Cabecera({ usuario, prefs, avisos }: { usuario: Usuario | null; prefs: Preferencias; avisos: number }) {
  const nav = usuario?.rol === "empresa" ? NAV_EMPRESA : usuario?.rol === "persona" ? NAV_PERSONA : null;
  return (
    <header className="relative z-30">
      <a href="#contenido" className="saltar">Saltar al contenido</a>
      <div className="contenedor flex flex-wrap items-center gap-x-3 gap-y-2 py-4">
        <Marca />
        <nav aria-label="Principal" className="hidden md:flex items-center gap-1 ms-4 lg:ms-8">
          {nav ? (
            nav.filter((n) => n.a !== "/avisos").map((n) => (
              <NavLink key={n.a} to={n.a} end={n.fin} className="nav-enlace">{n.texto}</NavLink>
            ))
          ) : (
            <>
              <NavLink to="/vacantes" className="nav-enlace">Vacantes</NavLink>
              <Link to="/#como-funciona" className="nav-enlace">Cómo funciona</Link>
              <Link to="/#empresas" className="nav-enlace">Empresas</Link>
            </>
          )}
        </nav>
        <div className="ms-auto flex flex-wrap items-center justify-end gap-2">
          <PanelAccesibilidad prefs={prefs} />
          {usuario ? (
            <>
              <NavLink to="/avisos" className="btn btn-suave btn-icono relative" aria-label={avisos ? `Avisos, ${avisos} sin leer` : "Avisos"}>
                <Icono nombre="campana" className="size-6" />
                {avisos > 0 && (
                  <span aria-hidden="true" className="absolute -top-1 -right-1 min-w-6 h-6 px-1.5 rounded-full bg-tinta text-white text-sm font-black grid place-items-center num">{avisos}</span>
                )}
              </NavLink>
              <details className="panel-desplegable relative">
                <summary className="btn btn-claro btn-icono md:px-4" aria-label={`Cuenta de ${usuario.nombre}`}>
                  <Icono nombre="persona" className="size-6" />
                  <span className="hidden lg:inline max-w-40 truncate">{usuario.nombre.split(" ")[0]}</span>
                </summary>
                <div className="absolute right-0 z-50 mt-3 w-72 tarjeta shadow-[0_24px_60px_-20px_rgb(27_27_31/0.45)] grid gap-3">
                  <p className="font-bold leading-tight">{usuario.nombre}<span className="block ayuda font-normal">{usuario.email}</span></p>
                  {usuario.es_demo && <p className="estado estado-neutro justify-self-start">Cuenta de demostración</p>}
                  <Form method="post" action="/salir">
                    <button className="btn btn-claro w-full" type="submit"><Icono nombre="salir" className="size-5" /> Salir</button>
                  </Form>
                </div>
              </details>
            </>
          ) : (
            <Link to="/ingresar" className="btn btn-claro">Entrar</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function BarraInferior({ rol, avisos }: { rol: "persona" | "empresa"; avisos: number }) {
  // En el celular la persona ve 4 destinos (el catálogo sigue a un toque desde «Para ti»); la campana vive arriba.
  const nav = rol === "empresa" ? NAV_EMPRESA : NAV_PERSONA.filter((n) => n.a !== "/vacantes");
  return (
    <nav aria-label="Atajos" className="barra-inferior md:hidden no-imprimir">
      <ul className="grid p-1.5" role="list" style={{ ["--n" as string]: nav.length }}>
        {nav.map((n) => (
          <li key={n.a}>
            <NavLink to={n.a} end={n.fin}>
              <Icono nombre={n.icono} className="size-6" />
              <span>{n.texto}{n.a === "/avisos" && avisos ? ` (${avisos})` : ""}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Pie() {
  return (
    <footer className="mt-20 pb-44 md:pb-12">
      <div className="contenedor grid gap-8 md:grid-cols-[1.4fr_1fr_1fr] border-t-2 border-filete pt-10">
        <div className="grid gap-3 content-start">
          <Marca />
          <p className="text-tinta-2 max-w-md">Vinculación laboral de personas con discapacidad con accesibilidad del puesto verificada en sitio. Gratis, siempre, para las personas.</p>
          <p className="text-tinta-2 text-base">Proyecto académico · Universidad Tecnológica de Bolívar · NRC 2357 · Cartagena, 2026. Las vacantes y cuentas de esta versión son de demostración.</p>
        </div>
        <nav aria-label="Información" className="grid gap-2 content-start">
          <Link to="/vacantes" className="enlace">Vacantes</Link>
          <Link to="/accesibilidad" className="enlace">Declaración de accesibilidad</Link>
          <Link to="/privacidad" className="enlace">Privacidad y datos</Link>
        </nav>
        <div className="grid gap-2 content-start text-base text-tinta-2">
          <p><strong className="text-tinta">Datos:</strong> DANE, Gran Encuesta Integrada de Hogares, trimestre junio–agosto de 2026.</p>
          <p><strong className="text-tinta">Normas:</strong> Ley 2466 de 2025, Ley 1618 de 2013, Ley 1581 de 2012.</p>
        </div>
      </div>
    </footer>
  );
}
