import { Link, useRouteLoaderData } from "react-router";
import type { Route } from "./+types/accesibilidad";
import type { loader as rootLoader } from "~/root";
import { PanelAccesibilidad } from "~/components/shell";
import { PREFERENCIAS_BASE } from "~/lib/preferencias";

export const meta: Route.MetaFunction = () => [{ title: "Declaración de accesibilidad — IncluTrabajo IA" }];

const FORMAS = [
  ["Con lector de pantalla", "Probado con NVDA y Narrador en Windows, TalkBack en Android y VoiceOver. Cada página tiene un título, encabezados en orden y regiones con nombre. Al cambiar de página te anunciamos dónde estás."],
  ["Solo con teclado o conmutador", "Todo se alcanza con Tab y se activa con Enter o Espacio. El foco siempre se ve. El primer Tab muestra «Saltar al contenido»."],
  ["Con voz", "En las coincidencias y las vacantes, el botón «Escuchar» lee la explicación. En los campos de texto puedes dictar con el micrófono (Chrome, Edge y Safari). El audio no pasa por nuestros servidores."],
  ["Con baja visión", "Puedes agrandar el texto hasta 400 % sin perder contenido, activar alto contraste, usar la letra Atkinson Hyperlegible y dar más espacio entre líneas. También respetamos el alto contraste de Windows."],
  ["Con poca señal o un celular sencillo", "Las páginas llegan armadas desde el servidor y los formularios funcionan aunque el navegador no ejecute JavaScript."],
  ["Si te cuesta leer textos largos", "Escribimos con frases cortas y palabras de uso diario. Las coincidencias se explican una idea por línea."],
] as const;

export default function Accesibilidad() {
  const raiz = useRouteLoaderData<typeof rootLoader>("root");
  return (
    <div className="contenedor py-8 md:py-12 grid gap-8 max-w-4xl">
      <div className="grid gap-3">
        <h1 className="titulo-pagina">Declaración de accesibilidad</h1>
        <p className="subtitulo max-w-[65ch]">
          Queremos que cualquier persona pueda usar IncluTrabajo IA, con o sin discapacidad. Nuestra meta es cumplir las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2 en nivel AA, y la Resolución 1519 de 2020 del MinTIC.
        </p>
      </div>

      <section className="tarjeta tarjeta-grande grid gap-4" aria-labelledby="t-ajusta">
        <h2 id="t-ajusta" className="text-3xl">Ajusta la página</h2>
        <p className="text-tinta-2">Estos ajustes se guardan en este dispositivo y funcionan sin cuenta. También están en el botón de accesibilidad de la parte de arriba.</p>
        <div className="w-fit"><PanelAccesibilidad prefs={raiz?.prefs ?? PREFERENCIAS_BASE} /></div>
      </section>

      <section className="grid gap-4" aria-labelledby="t-formas">
        <h2 id="t-formas" className="text-3xl">Formas de usarla</h2>
        <ul className="grid gap-4 md:grid-cols-2" role="list">
          {FORMAS.map(([t, d]) => (
            <li key={t} className="tarjeta grid gap-2">
              <h3 className="text-2xl">{t}</h3>
              <p className="text-tinta-2">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="tarjeta tarjeta-grande grid gap-3" aria-labelledby="t-limites">
        <h2 id="t-limites" className="text-3xl">Lo que aún no está listo</h2>
        <ul className="list-disc ps-6 grid gap-2 text-lg">
          <li>Videos en Lengua de Señas Colombiana para las páginas principales.</li>
          <li>Avisos por WhatsApp y por correo; hoy solo llegan dentro de la plataforma.</li>
          <li>Versión en inglés y portugués.</li>
        </ul>
      </section>

      <section className="tarjeta tarjeta-grande grid gap-3" aria-labelledby="t-contacto">
        <h2 id="t-contacto" className="text-3xl">¿Encontraste una barrera?</h2>
        <p className="text-lg">Escríbenos a <a className="enlace" href="mailto:accesibilidad@inclutrabajo.co">accesibilidad@inclutrabajo.co</a> y cuéntanos en qué página, qué intentabas hacer y qué tecnología usas. Respondemos en máximo 5 días hábiles.</p>
        <p className="ayuda">Última revisión: noviembre de 2026. <Link to="/privacidad" className="enlace">Política de privacidad</Link>.</p>
      </section>
    </div>
  );
}
