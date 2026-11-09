import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ESTADOS_AJUSTE, fecha, type EstadoAjuste } from "~/lib/catalogo";
import type { EstadoFila, Fila } from "~/lib/matching";
import { Icono, type NombreIcono } from "./Icono";

export function anunciar(texto: string) {
  const region = typeof document !== "undefined" ? document.getElementById("anunciador") : null;
  if (!region) return;
  region.textContent = "";
  window.setTimeout(() => (region.textContent = texto), 60);
}

/** Puntaje de 0 a 100 dibujado como anillo; el número y el texto siempre acompañan al dibujo. */
export function Anillo({ puntaje, tamano = 96, etiqueta }: { puntaje: number; tamano?: number; etiqueta?: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid place-items-center shrink-0" style={{ width: tamano, height: tamano }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-suelo-2)" strokeWidth="12" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="var(--color-tinta)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, puntaje)) / 100)}
          data-anillo
        />
      </svg>
      <span className="relative num font-black leading-none" style={{ fontSize: tamano * 0.3 }} aria-hidden="true">
        <span data-anillo-numero>{puntaje}</span>
      </span>
      <span className="sr-only">{etiqueta ?? `${puntaje} de 100`}</span>
    </span>
  );
}

const MARCA: Record<EstadoFila, { icono: NombreIcono; texto: string }> = {
  si: { icono: "check", texto: "Sí" },
  parte: { icono: "guion", texto: "En parte" },
  no: { icono: "equis", texto: "Falta" },
  sin_datos: { icono: "info", texto: "Sin datos" },
};

export function Marca({ estado, ajuste }: { estado: EstadoFila; ajuste?: EstadoAjuste }) {
  const variante = ajuste ?? estado;
  const icono: NombreIcono = ajuste === "verificado" ? "sello" : ajuste === "ajustable" ? "reloj" : MARCA[estado].icono;
  const texto = ajuste ? `${MARCA[estado].texto}, ${ESTADOS_AJUSTE[ajuste].nombre.toLowerCase()}` : MARCA[estado].texto;
  return (
    <span className={`marca marca-${variante}`}>
      <Icono nombre={icono} className="size-5" />
      <span className="sr-only">{texto}:</span>
    </span>
  );
}

export function FilasCoincidencia({ filas, compacto = false }: { filas: Fila[]; compacto?: boolean }) {
  return (
    <ul className="grid gap-2" role="list">
      {filas.map((f, i) => (
        <li key={i} className={`flex items-start gap-3 rounded-2xl bg-suelo ${compacto ? "px-3 py-2.5" : "px-4 py-3"}`} data-razon>
          <Marca estado={f.estado} ajuste={f.ajuste} />
          <span className="min-w-0">
            <span className="block font-bold leading-snug">{f.frase}</span>
            {!compacto && <span className="block text-tinta-2 text-base leading-snug mt-0.5">{f.detalle}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function EstadoAjusteChip({ estado, verificadoEn, compromisoEn }: { estado: EstadoAjuste; verificadoEn?: string | null; compromisoEn?: string | null }) {
  const icono: NombreIcono = estado === "verificado" ? "sello" : estado === "ajustable" ? "reloj" : "conversacion";
  const extra = estado === "verificado" && verificadoEn ? ` · ${fecha(verificadoEn)}` : estado === "ajustable" && compromisoEn ? ` · antes del ${fecha(compromisoEn)}` : "";
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={`estado estado-${estado}`}>
        <Icono nombre={icono} className="size-[1.1rem]" />
        {ESTADOS_AJUSTE[estado].nombre}
      </span>
      {extra && <span className="text-base font-semibold text-tinta-2">{extra.replace(/^ · /, "")}</span>}
    </span>
  );
}

export function Campo({
  etiqueta, ayuda, error, children, id, opcional,
}: { etiqueta: string; ayuda?: ReactNode; error?: string; children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode; id?: string; opcional?: boolean }) {
  const auto = useId();
  const campoId = id ?? auto;
  const ayudaId = ayuda ? `${campoId}-ayuda` : undefined;
  const errorId = error ? `${campoId}-error` : undefined;
  const describedby = [ayudaId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="campo">
      <label htmlFor={campoId} className="etiqueta">
        {etiqueta} {opcional && <span className="font-semibold text-tinta-2">(opcional)</span>}
      </label>
      {ayuda && <p id={ayudaId} className="ayuda">{ayuda}</p>}
      {children({ id: campoId, "aria-describedby": describedby, "aria-invalid": error ? true : undefined })}
      {error && (
        <p id={errorId} className="error-campo">
          <Icono nombre="alerta" className="size-5 shrink-0 mt-0.5" />
          {error}
        </p>
      )}
    </div>
  );
}

export function ErroresFormulario({ errores }: { errores?: Record<string, string> | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const lista = errores ? Object.values(errores) : [];
  useEffect(() => {
    if (lista.length) ref.current?.focus();
  }, [errores]);
  if (!lista.length) return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="rounded-control bg-falta-suave text-falta p-4 font-bold">
      <p className="flex items-center gap-2"><Icono nombre="alerta" className="size-5" /> Revisa {lista.length === 1 ? "este dato" : `estos ${lista.length} datos`}:</p>
      <ul className="list-disc ps-8 mt-1 font-semibold">
        {lista.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </div>
  );
}

export function Vacio({ titulo, children, accion }: { titulo: string; children?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="tarjeta text-center grid gap-3 justify-items-center py-10">
      <span className="marca marca-sin_datos size-14"><Icono nombre="buscar" className="size-7" /></span>
      <h2 className="text-2xl">{titulo}</h2>
      {children && <div className="text-tinta-2 max-w-prose">{children}</div>}
      {accion}
    </div>
  );
}

/** Lee un texto en voz alta con la voz del navegador. No aparece si el navegador no puede hablar. */
export function BotonEscuchar({ texto, etiqueta = "Escuchar la explicación" }: { texto: string; etiqueta?: string }) {
  const [puede, setPuede] = useState(false);
  const [hablando, setHablando] = useState(false);
  useEffect(() => {
    setPuede(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);
  if (!puede) return null;
  const alternar = () => {
    const s = window.speechSynthesis;
    if (hablando) {
      s.cancel();
      setHablando(false);
      return;
    }
    s.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-CO";
    u.rate = 0.95;
    u.onend = () => setHablando(false);
    u.onerror = () => setHablando(false);
    setHablando(true);
    s.speak(u);
  };
  return (
    <button type="button" className="btn btn-claro" onClick={alternar} aria-pressed={hablando}>
      <Icono nombre="bocina" className="size-5" />
      {hablando ? "Detener" : etiqueta}
    </button>
  );
}

/** Dictado por voz para un campo de texto (Chrome, Edge, Safari). El audio no pasa por nuestro servidor. */
export function BotonDictar({ para, etiquetaCampo }: { para: string; etiquetaCampo: string }) {
  const [soportado, setSoportado] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const rec = useRef<any>(null);
  useEffect(() => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    setSoportado(Boolean(SR));
  }, []);
  if (!soportado) return null;
  const alternar = () => {
    if (escuchando) {
      rec.current?.stop();
      return;
    }
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.lang = "es-CO";
    r.interimResults = false;
    r.onresult = (e: any) => {
      const texto = Array.from(e.results).map((x: any) => x[0].transcript).join(" ");
      const campo = document.getElementById(para) as HTMLInputElement | HTMLTextAreaElement | null;
      if (campo) {
        campo.value = (campo.value ? campo.value + " " : "") + texto;
        campo.dispatchEvent(new Event("input", { bubbles: true }));
        anunciar(`Texto agregado: ${texto}`);
      }
    };
    r.onend = () => setEscuchando(false);
    r.onerror = () => {
      setEscuchando(false);
      anunciar("No pudimos usar el micrófono.");
    };
    rec.current = r;
    setEscuchando(true);
    anunciar("Escuchando. Habla ahora.");
    r.start();
  };
  return (
    <button type="button" className="btn btn-suave btn-icono" onClick={alternar} aria-pressed={escuchando} aria-label={escuchando ? `Detener dictado en ${etiquetaCampo}` : `Dictar ${etiquetaCampo} con la voz`}>
      <Icono nombre="microfono" className="size-5" />
    </button>
  );
}
