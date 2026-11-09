import { useEffect, useRef } from "react";
import {
  data, isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration,
  useLocation, useRouteLoaderData,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { leerPreferencias } from "./.server/preferencias";
import { PREFERENCIAS_BASE } from "./lib/preferencias";
import { leerAviso, usuarioActual } from "./.server/sesion";
import { contarAvisos } from "./.server/datos";
import { BarraInferior, Cabecera, Pie } from "./components/shell";

export const meta: Route.MetaFunction = () => [
  { title: "IncluTrabajo IA — empleo con accesibilidad verificada" },
  { name: "description", content: "Encuentra empleo con la accesibilidad que necesitas, verificada en el puesto, y entiende por qué cada vacante encaja contigo. Gratis para las personas." },
];

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "manifest", href: "/manifest.webmanifest" },
];

export async function loader({ request }: Route.LoaderArgs) {
  const [usuario, prefs, flash] = await Promise.all([usuarioActual(request), leerPreferencias(request), leerAviso(request)]);
  const avisos = usuario ? await contarAvisos(usuario.id) : 0;
  return data(
    { usuario, prefs, avisos, aviso: flash.aviso },
    flash.cookie ? { headers: { "Set-Cookie": flash.cookie } } : undefined,
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const datos = useRouteLoaderData<typeof loader>("root");
  const prefs = datos?.prefs ?? PREFERENCIAS_BASE;
  return (
    <html
      lang="es-CO"
      data-texto={prefs.texto}
      data-contraste={prefs.contraste}
      data-letra={prefs.letra}
      data-espaciado={prefs.espaciado}
      data-movimiento={prefs.movimiento}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#fce9dd" />
        <noscript>
          <style>{".js-solo{display:none!important}"}</style>
        </noscript>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <div id="anunciador" className="sr-only" aria-live="polite" aria-atomic="true" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/** Al navegar sin recargar: el foco va al título de la nueva página y el lector lo anuncia. */
function useFocoAlNavegar() {
  const { pathname } = useLocation();
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    const h1 = document.querySelector<HTMLElement>("main h1");
    if (h1) {
      if (!h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: false });
    }
    const region = document.getElementById("anunciador");
    if (region) {
      region.textContent = "";
      window.setTimeout(() => (region.textContent = `Página: ${document.title}`), 80);
    }
  }, [pathname]);
}

export default function App({ loaderData }: Route.ComponentProps) {
  useFocoAlNavegar();
  const { usuario, prefs, avisos, aviso } = loaderData;
  const { pathname } = useLocation();
  const enApp = usuario && (pathname.startsWith("/persona") || pathname.startsWith("/empresa") || pathname.startsWith("/avisos"));
  return (
    <>
      <Cabecera usuario={usuario} prefs={prefs} avisos={avisos} />
      {aviso && (
        <div className="contenedor mt-2" role="status">
          <p className="aviso-flash">{aviso}</p>
        </div>
      )}
      <main id="contenido" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Pie />
      {enApp && (usuario.rol === "persona" || usuario.rol === "empresa") && <BarraInferior rol={usuario.rol} avisos={avisos} />}
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let titulo = "Algo salió mal";
  let detalle = "Tuvimos un problema al mostrar esta página. Intenta de nuevo en un momento.";
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      titulo = "No encontramos esta página";
      detalle = "Puede que el enlace esté mal escrito o que la vacante ya no exista.";
    } else if (error.status === 403) {
      titulo = "No tienes acceso a esta página";
      detalle = typeof error.data === "string" ? error.data : detalle;
    }
  } else if (import.meta.env.DEV && error instanceof Error) {
    detalle = error.message;
  }
  return (
    <main id="contenido" className="contenedor py-16">
      <div className="tarjeta tarjeta-grande max-w-2xl grid gap-4">
        <h1 className="titulo-pagina">{titulo}</h1>
        <p className="subtitulo">{detalle}</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/" className="btn btn-accion">Ir al inicio</Link>
          <Link to="/vacantes" className="btn btn-claro">Ver vacantes</Link>
        </div>
      </div>
    </main>
  );
}
