import { useEffect, useRef, useState } from "react";
import { Form, Link, useFetcher, useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";
import type { Route } from "./+types/home";
import { cargarPersona, cargarVacante } from "~/.server/datos";
import { cop, MODALIDADES } from "~/lib/catalogo";
import { calcularCumplimiento } from "~/lib/cumplimiento";
import { emparejar, PESOS } from "~/lib/matching";
import { Icono } from "~/components/Icono";
import { Anillo, EstadoAjusteChip, FilasCoincidencia } from "~/components/ui";

export const meta: Route.MetaFunction = () => [
  { title: "IncluTrabajo IA — tu talento, en el puesto que te sirve" },
  { name: "description", content: "Vacantes con la accesibilidad que necesitas, verificada en el puesto por ingeniería civil y biomédica. Cada coincidencia se explica en palabras sencillas. Gratis para las personas." },
];

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const trabajadores = Math.min(100_000, Math.max(0, Number(url.searchParams.get("trabajadores") ?? 300) || 0));
  const vinculadas = Math.min(10_000, Math.max(0, Number(url.searchParams.get("vinculadas") ?? 1) || 0));
  const [ana, vacante] = await Promise.all([cargarPersona(1), cargarVacante(1)]);
  const ejemplo =
    ana && vacante
      ? {
          nombre: ana.nombre.split(" ")[0],
          vacanteId: vacante.id,
          cargo: vacante.cargo,
          empresa: vacante.empresa,
          lugar: `${vacante.ciudad} · ${MODALIDADES[vacante.modalidad]} · ${cop(vacante.salario)}`,
          resultado: emparejar(ana, vacante),
        }
      : null;
  return { ejemplo, trabajadores, vinculadas, calculo: calcularCumplimiento({ trabajadores, vinculadas }) };
}

const CRITERIOS = [
  { puntos: PESOS.competencias, titulo: "Lo que sabes hacer", texto: "Comparamos tus competencias con las que pide el puesto. Si te falta alguna, te decimos cuál." },
  { puntos: PESOS.ajustes, titulo: "Los ajustes que necesitas", texto: "Un ajuste verificado en el puesto cuenta completo; uno que solo declara la empresa, menos. Si falta uno esencial, te lo decimos claro." },
  { puntos: PESOS.lugar, titulo: "Dónde y cómo se trabaja", texto: "Tu ciudad y si prefieres presencial, híbrido o remoto." },
  { puntos: PESOS.condiciones, titulo: "Salario y jornada", texto: "Si paga lo que esperas y si el horario te sirve." },
];

function useCoincidenciaSeArma(ref: React.RefObject<HTMLElement | null>, puntaje: number) {
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    const reducido =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.movimiento === "reducido";
    if (reducido) return;
    let limpiar = () => {};
    let cancelado = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelado) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        const filas = gsap.utils.toArray<HTMLElement>("[data-armado] [data-razon]");
        const arco = raiz.querySelector<SVGCircleElement>("[data-armado] [data-anillo]");
        const numero = raiz.querySelector<HTMLElement>("[data-armado] [data-anillo-numero]");
        const pasos = gsap.utils.toArray<HTMLElement>("[data-paso]");
        if (!arco || !numero) return;
        const largo = Number(arco.getAttribute("stroke-dasharray"));
        const contador = { valor: 0 };
        gsap.set(filas, { autoAlpha: 0, y: 28, scale: 0.96 });
        gsap.set(arco, { strokeDashoffset: largo });
        numero.textContent = "0";
        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: raiz, start: "top 70%", end: "bottom 75%", scrub: 0.6 },
        });
        filas.forEach((fila, i) => {
          tl.to(fila, { autoAlpha: 1, y: 0, scale: 1, duration: 1 }, i * 0.9);
        });
        tl.to(arco, { strokeDashoffset: largo * (1 - puntaje / 100), duration: filas.length * 0.9 }, 0);
        tl.to(contador, { valor: puntaje, duration: filas.length * 0.9, onUpdate: () => (numero.textContent = String(Math.round(contador.valor))) }, 0);
        pasos.forEach((paso) => {
          ScrollTrigger.create({
            trigger: paso,
            start: "top 65%",
            end: "bottom 45%",
            toggleClass: { targets: paso, className: "paso-activo" },
          });
        });
      }, raiz);
      limpiar = () => ctx.revert();
    })();
    return () => {
      cancelado = true;
      limpiar();
    };
  }, [ref, puntaje]);
}

function Puertas({ grande = true }: { grande?: boolean }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${grande ? "" : "max-w-3xl"}`}>
      <Link to="/registro?rol=persona" className="tarjeta tarjeta-tocable tarjeta-grande bg-accion text-white grid gap-6 min-h-52">
        <span className="size-16 rounded-[1.25rem] bg-white/15 grid place-items-center" aria-hidden="true"><Icono nombre="persona" className="size-9" /></span>
        <span className="mt-auto">
          <span className="block text-3xl font-black tracking-tight">Busco empleo</span>
          <span className="block text-lg text-white/90 mt-1">Gratis, siempre. Funciona con lector de pantalla y con voz.</span>
        </span>
      </Link>
      <Link to="/registro?rol=empresa" className="tarjeta tarjeta-tocable tarjeta-grande grid gap-6 min-h-52">
        <span className="size-16 rounded-[1.25rem] bg-suelo grid place-items-center" aria-hidden="true"><Icono nombre="edificio" className="size-9" /></span>
        <span className="mt-auto">
          <span className="block text-3xl font-black tracking-tight">Contrato talento</span>
          <span className="block text-lg text-tinta-2 mt-1">Cumple la cuota de la Ley 2466 contratando bien.</span>
        </span>
      </Link>
    </div>
  );
}

function Puntos({ de, tienen, etiqueta }: { de: number; tienen: number; etiqueta: string }) {
  return (
    <figure className="grid gap-3">
      <div className="grid grid-cols-20 gap-1.5 max-w-md" aria-hidden="true">
        {Array.from({ length: de }, (_, i) => (
          <span key={i} className={`aspect-square rounded-full ${i < tienen ? "bg-tinta" : "border-2 border-tinta-2"}`} />
        ))}
      </div>
      <figcaption className="font-bold text-lg">{etiqueta}</figcaption>
    </figure>
  );
}

function Calculadora({ trabajadores: t0, vinculadas: v0 }: { trabajadores: number; vinculadas: number }) {
  const [t, setT] = useState(String(t0));
  const [v, setV] = useState(String(v0));
  const c = calcularCumplimiento({ trabajadores: Number(t) || 0, vinculadas: Number(v) || 0 });
  return (
    <div className="tarjeta tarjeta-grande grid gap-6">
      <Form method="get" action="/#empresas" preventScrollReset className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <div className="campo">
          <label htmlFor="trabajadores" className="etiqueta">Trabajadores de planta</label>
          <input id="trabajadores" name="trabajadores" type="number" inputMode="numeric" min={0} max={100000} className="entrada num" value={t} onChange={(e) => setT(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="vinculadas" className="etiqueta">Personas con discapacidad ya vinculadas</label>
          <input id="vinculadas" name="vinculadas" type="number" inputMode="numeric" min={0} max={10000} className="entrada num" value={v} onChange={(e) => setV(e.target.value)} />
        </div>
        <noscript>
          <button className="btn btn-claro sm:col-span-2" type="submit">Calcular</button>
        </noscript>
      </Form>
      <div aria-live="polite" className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-suelo p-5">
          <p className="text-tinta-2 font-bold">Cuota</p>
          <p className="text-5xl font-black num tracking-tight mt-1">{c.cuota}</p>
          <p className="text-tinta-2 text-base">{c.obligada ? "personas con discapacidad" : "No está obligada (menos de 100)"}</p>
        </div>
        <div className="rounded-3xl bg-suelo p-5">
          <p className="text-tinta-2 font-bold">Por contratar</p>
          <p className="text-5xl font-black num tracking-tight mt-1">{c.brecha}</p>
          <p className="text-tinta-2 text-base">{c.cumple ? "Ya cumple la cuota" : "para cumplir"}</p>
        </div>
        <div className="rounded-3xl bg-suelo p-5 sm:col-span-2">
          <p className="text-tinta-2 font-bold">Ahorro en renta al año</p>
          <p className="text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] font-black num tracking-tight mt-1">{cop(c.ahorroAnual)}</p>
          <p className="text-tinta-2 text-base">estimado, con deducción del 200 %</p>
        </div>
      </div>
      <p className="ayuda">
        Cuota: 2 por cada 100 trabajadores (Ley 2466 de 2025), interpretación preliminar mientras sale el decreto reglamentario.
        Ahorro: salario mínimo 2026, 70 % de las personas con limitación certificada de al menos 25 % (Ley 361 de 1997, art. 31) y tarifa de renta del 35 %.
      </p>
    </div>
  );
}

function PruebaAhora() {
  const fetcher = useFetcher();
  const aplicar = (campo: string, valor: string) => {
    document.documentElement.dataset[campo] = valor;
    const f = new FormData();
    f.set(campo, valor);
    f.set("volver", "/");
    fetcher.submit(f, { method: "post", action: "/preferencias" });
  };
  const botones: [string, string, string, string][] = [
    ["texto", "grande", "normal", "Texto grande"],
    ["contraste", "alto", "normal", "Alto contraste"],
    ["letra", "legible", "estandar", "Letra de alta legibilidad"],
    ["espaciado", "amplio", "normal", "Más espacio entre líneas"],
  ];
  return (
    <Form method="post" action="/preferencias" reloadDocument className="flex flex-wrap gap-3" onSubmit={(e) => e.preventDefault()}>
      <input type="hidden" name="volver" value="/#accesible" />
      {botones.map(([campo, si, no, texto]) => (
        <BotonPreferencia key={campo} campo={campo} si={si} no={no} texto={texto} aplicar={aplicar} />
      ))}
    </Form>
  );
}

function BotonPreferencia({ campo, si, no, texto, aplicar }: { campo: string; si: string; no: string; texto: string; aplicar: (c: string, v: string) => void }) {
  const [activo, setActivo] = useState(false);
  useEffect(() => setActivo(document.documentElement.dataset[campo] === si), [campo, si]);
  return (
    <button
      type="submit"
      name={campo}
      value={activo ? no : si}
      aria-pressed={activo}
      className={`btn ${activo ? "btn-accion" : "btn-claro"}`}
      onClick={(e) => {
        e.preventDefault();
        const nuevo = !activo;
        setActivo(nuevo);
        aplicar(campo, nuevo ? si : no);
      }}
    >
      {activo && <Icono nombre="check" className="size-5" />}
      {texto}
    </button>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { ejemplo, trabajadores, vinculadas } = loaderData;
  const conSesion = Boolean(useRouteLoaderData<typeof rootLoader>("root")?.usuario);
  const armado = useRef<HTMLElement>(null);
  useCoincidenciaSeArma(armado, ejemplo?.resultado.puntaje ?? 0);

  return (
    <>
      {/* Primera pantalla: dos puertas y una coincidencia real explicada */}
      <section className="contenedor pt-6 md:pt-12 pb-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center" aria-labelledby="titulo-portada">
        <div className="grid gap-8">
          <h1 id="titulo-portada" className="text-[clamp(3rem,1.6rem+5.6vw,6rem)] leading-[0.95] font-black tracking-[-0.04em]">
            Hola. Aquí tu talento cuenta.
          </h1>
          <p className="text-[1.375rem] leading-relaxed text-tinta-2 max-w-[38rem]">
            Te mostramos empleos con la accesibilidad que necesitas, revisada en el puesto por nuestro equipo de ingeniería,
            y te decimos en palabras sencillas por qué encajan contigo.
          </p>
          <Puertas />
          {!conSesion && (
            <p className="text-tinta-2">
              ¿Ya tienes cuenta? <Link to="/ingresar" className="enlace">Entrar</Link> · <Link to="/vacantes" className="enlace">Ver vacantes sin registrarte</Link>
            </p>
          )}
        </div>
        {ejemplo && (
          <article className="tarjeta tarjeta-grande grid gap-5" aria-labelledby="ejemplo-cargo">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 id="ejemplo-cargo" className="text-3xl">{ejemplo.cargo}</h2>
                <span className="estado estado-neutro shrink-0">Datos de demostración</span>
              </div>
              <p className="text-tinta-2">{ejemplo.empresa} · {ejemplo.lugar}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Anillo puntaje={ejemplo.resultado.puntaje} tamano={104} etiqueta={`${ejemplo.resultado.puntaje} de 100, ${ejemplo.resultado.etiqueta}`} />
              <p className="text-2xl font-black leading-tight">{ejemplo.resultado.etiqueta} con {ejemplo.nombre}</p>
            </div>
            <FilasCoincidencia filas={ejemplo.resultado.filas.slice(0, 3)} compacto />
            <Link to={`/vacantes/${ejemplo.vacanteId}`} className="btn btn-accion btn-grande">
              Ver esta vacante <Icono nombre="flecha" className="size-5" />
            </Link>
          </article>
        )}
      </section>

      {/* Gesto propio: la coincidencia se arma mientras bajas */}
      {ejemplo && (
        <section ref={armado} id="como-funciona" className="bg-suelo-2 py-20 md:py-28" aria-labelledby="titulo-armado">
          <div className="contenedor grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
            <div className="grid gap-10 content-start">
              <div className="grid gap-4">
                <h2 id="titulo-armado" className="text-[clamp(2.25rem,1.4rem+3vw,4rem)] leading-none">Así se arma una coincidencia</h2>
                <p className="text-xl text-tinta-2 max-w-xl">Cuatro preguntas, 100 puntos. Nada de cajas negras: ves cuánto suma cada cosa y qué falta.</p>
              </div>
              <ol className="grid gap-5" role="list">
                {CRITERIOS.map((c) => (
                  <li key={c.titulo} data-paso className="paso tarjeta grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 items-baseline transition-[transform,box-shadow] duration-500">
                    <span className="row-span-2 num font-black text-4xl tracking-tight w-20">{c.puntos}<span className="sr-only"> puntos</span><span aria-hidden="true" className="text-lg text-tinta-2 font-bold"> pts</span></span>
                    <h3 className="text-2xl">{c.titulo}</h3>
                    <p className="text-tinta-2">{c.texto}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lg:sticky lg:top-8 self-start" data-armado>
              <div className="tarjeta tarjeta-grande grid gap-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Anillo puntaje={ejemplo.resultado.puntaje} tamano={120} etiqueta={`${ejemplo.resultado.puntaje} de 100`} />
                  <div className="min-w-0 basis-40 grow">
                    <p className="text-2xl font-black leading-tight">{ejemplo.cargo}</p>
                    <p className="text-tinta-2">{ejemplo.resultado.etiqueta} con {ejemplo.nombre}</p>
                  </div>
                </div>
                <FilasCoincidencia filas={ejemplo.resultado.filas} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Verificado le gana a declarado */}
      <section className="contenedor py-20 md:py-28 grid gap-10 lg:grid-cols-2 lg:items-center" aria-labelledby="titulo-verificado">
        <div className="grid gap-5">
          <h2 id="titulo-verificado" className="text-[clamp(2.25rem,1.4rem+3vw,4rem)] leading-none">Lo que dice la empresa, lo revisamos en el puesto</h2>
          <p className="text-xl text-tinta-2 max-w-xl">
            Un ingeniero civil y una ingeniera biomédica visitan el puesto, miden la rampa, prueban los programas con lector de pantalla y
            dejan la evidencia. Así sabes qué es cierto antes de postularte.
          </p>
        </div>
        <ul className="grid gap-4" role="list">
          <li className="tarjeta grid gap-2">
            <EstadoAjusteChip estado="verificado" verificadoEn="2026-10-14" />
            <p className="text-xl font-bold">Rampa medida: 7,8 % de pendiente, con pasamanos.</p>
            <p className="text-tinta-2">Cuenta completo en tu coincidencia.</p>
          </li>
          <li className="tarjeta grid gap-2">
            <EstadoAjusteChip estado="declarado" />
            <p className="text-xl font-bold">«Tenemos horario flexible», dice la empresa.</p>
            <p className="text-tinta-2">Cuenta, pero menos, hasta que lo revisemos.</p>
          </li>
          <li className="tarjeta grid gap-2">
            <EstadoAjusteChip estado="ajustable" compromisoEn="2026-12-01" />
            <p className="text-xl font-bold">Intérprete de Lengua de Señas desde diciembre.</p>
            <p className="text-tinta-2">La empresa se compromete a tenerlo en esa fecha.</p>
          </li>
        </ul>
      </section>

      {/* El dato, sin adornos */}
      <section className="bg-suelo-2 py-20 md:py-24" aria-labelledby="titulo-dato">
        <div className="contenedor grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-4 max-w-2xl">
            <h2 id="titulo-dato" className="text-[clamp(2rem,1.3rem+2.6vw,3.5rem)] leading-tight">
              En Colombia, de cada 100 personas con discapacidad en edad de trabajar, 19 tienen empleo. Sin discapacidad, son 61.
            </h2>
            <p className="text-tinta-2">DANE, Gran Encuesta Integrada de Hogares, trimestre junio–agosto de 2026: tasa de ocupación de 19,1 % frente a 61,0 %.</p>
          </div>
          <div className="grid gap-8">
            <Puntos de={100} tienen={19} etiqueta="Con discapacidad: 19 de 100" />
            <Puntos de={100} tienen={61} etiqueta="Sin discapacidad: 61 de 100" />
          </div>
        </div>
      </section>

      {/* Empresas */}
      <section id="empresas" className="contenedor py-20 md:py-28 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start" aria-labelledby="titulo-empresas">
        <div className="grid gap-5">
          <h2 id="titulo-empresas" className="text-[clamp(2.25rem,1.4rem+3vw,4rem)] leading-none">Cumple la cuota contratando bien</h2>
          <p className="text-xl text-tinta-2">
            Desde el 25 de junio de 2026, las empresas con 100 o más trabajadores deben vincular personas con discapacidad.
            Te ayudamos a cumplir con puestos accesibles y personas que se quedan.
          </p>
          <ul className="grid gap-3 text-lg" role="list">
            <li className="flex gap-3"><Icono nombre="check" className="size-6 shrink-0 mt-0.5" /> Candidaturas ordenadas por compatibilidad, con la explicación de cada puntaje.</li>
            <li className="flex gap-3"><Icono nombre="check" className="size-6 shrink-0 mt-0.5" /> Diagnóstico del puesto con un índice de accesibilidad y ajustes con costo estimado.</li>
            <li className="flex gap-3"><Icono nombre="check" className="size-6 shrink-0 mt-0.5" /> Reporte de cuota y de deducción tributaria listo para descargar.</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link to="/registro?rol=empresa" className="btn btn-accion btn-grande">Crear cuenta de empresa</Link>
            <Link to="/ingresar" className="btn btn-claro btn-grande">Probar con una cuenta demo</Link>
          </div>
        </div>
        <Calculadora trabajadores={trabajadores} vinculadas={vinculadas} />
      </section>

      {/* Accesible de verdad: pruébalo aquí mismo */}
      <section id="accesible" className="contenedor pb-20 md:pb-28" aria-labelledby="titulo-accesible">
        <div className="tarjeta tarjeta-grande grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="grid gap-4">
            <h2 id="titulo-accesible" className="text-[clamp(2rem,1.3rem+2.6vw,3.5rem)] leading-none">Pruébalo aquí mismo</h2>
            <p className="text-xl text-tinta-2">
              Toca un botón y la página cambia. Funciona con lector de pantalla, solo con teclado, con dictado por voz y en celulares sencillos con poca señal.
            </p>
          </div>
          <div className="grid gap-5">
            <PruebaAhora />
            <Link to="/accesibilidad" className="enlace">Ver todo lo que puedes ajustar</Link>
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="contenedor grid gap-8" aria-labelledby="titulo-cierre">
        <h2 id="titulo-cierre" className="text-[clamp(2.5rem,1.5rem+3.6vw,4.75rem)] leading-[0.98] max-w-4xl">Elige tu puerta. El resto lo hacemos juntos.</h2>
        <Puertas grande={false} />
      </section>
    </>
  );
}
