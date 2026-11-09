// Íconos dibujados a mano en una retícula de 24 px, trazo 2,4 con puntas redondas.
const TRAZOS = {
  inicio: "M3.5 10.5 12 4l8.5 6.5M6 9v10.5h4.5v-5h3v5H18V9",
  buscar: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20",
  maletin: "M4 8h16v11H4zM9 8V5.5h6V8M4 13h16",
  persona: "M12 11.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20.5c.8-4.2 3.8-6.5 7.5-6.5s6.7 2.3 7.5 6.5",
  edificio: "M5 20.5V4h9v16.5M14 9h5v11.5M8 8h3M8 12h3M8 16h3M3 20.5h18",
  campana: "M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15ZM10 20.5a2 2 0 0 0 4 0",
  check: "m5 12.5 4.5 4.5L19 7.5",
  equis: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  reloj: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM12 7.5V12l3 2",
  sello: "M12 3.5 14 5.4l2.7-.3.6 2.7 2.4 1.3-1.1 2.5 1.1 2.5-2.4 1.3-.6 2.7-2.7-.3L12 20.5 10 18.6l-2.7.3-.6-2.7-2.4-1.3L5.4 12 4.3 9.5l2.4-1.3.6-2.7 2.7.3ZM9 12l2 2 4-4",
  guion: "M6 12h12",
  flecha: "M4.5 12h15M13.5 6l6 6-6 6",
  atras: "M19.5 12h-15M10.5 6l-6 6 6 6",
  bocina: "M4 9.5h3.5L12 5.5v13l-4.5-4H4ZM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",
  microfono: "M12 14.5a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5.5a3 3 0 0 0 3 3ZM6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5",
  accesibilidad: "M12 6.5a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5ZM5 8.5l7 1.5 7-1.5M12 10v4.5M9 21l3-6.5 3 6.5",
  salir: "M14.5 4.5h4v15h-4M10 8l-4 4 4 4M6 12h10",
  mas: "M12 5v14M5 12h14",
  lapiz: "M4.5 19.5 5.5 15 15.5 5l3.5 3.5-10 10ZM13.5 7l3.5 3.5",
  grafica: "M4.5 19.5h15M7 16v-5M12 16V7M17 16v-8",
  escudo: "M12 3.5 19 6v5.5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6Z",
  lista: "M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01",
  ubicacion: "M12 21s6.5-6.1 6.5-11.5a6.5 6.5 0 0 0-13 0C5.5 14.9 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  dinero: "M3.5 7h17v10h-17zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6.5 10v.01M17.5 14v.01",
  calendario: "M4.5 6.5h15v13h-15zM8 4v5M16 4v5M4.5 10.5h15",
  info: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM12 11v5.5M12 7.75v.01",
  alerta: "M12 4 21 19.5H3ZM12 10v4.5M12 17v.01",
  ojo: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  oido: "M7.5 9.5a4.5 4.5 0 0 1 9 0c0 3-3 3.5-3 6.5a2.5 2.5 0 0 1-5 0M10 9.5a2 2 0 0 1 4 0",
  pasos: "M8 20.5c-1.5 0-2.5-1-2.5-2.5 0-2 2-2.5 2-4.5M16 3.5c1.5 0 2.5 1 2.5 2.5 0 2-2 2.5-2 4.5M7 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 20.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  mente: "M9 20.5v-3H6.5a2 2 0 0 1-2-2v-2l-1-1 1-2.5a7 7 0 0 1 13.5-1.5c.9 2.8.1 5.4-1.5 7v5",
  mano: "M8 11V5.5a1.5 1.5 0 0 1 3 0V10m0-4.5a1.5 1.5 0 0 1 3 0V10m0-3a1.5 1.5 0 0 1 3 0v6.5c0 4-2.5 7-6.5 7-2.5 0-4-1.5-5.5-3.5L3.5 13a1.5 1.5 0 0 1 2.5-1.5L8 13.5",
  conversacion: "M4.5 5.5h15v10h-8l-4 3.5v-3.5h-3Z",
  ajustes: "M4.5 7h9M17.5 7h2M4.5 17h2M10.5 17h9M15.5 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  hogar: "M4.5 11 12 4.5l7.5 6.5v8.5h-15ZM9.5 19.5V14h5v5.5",
  menu: "M4.5 7h15M4.5 12h15M4.5 17h15",
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre, className = "size-6", titulo }: { nombre: NombreIcono; className?: string; titulo?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={titulo ? undefined : true}
      role={titulo ? "img" : undefined}
      focusable="false"
    >
      {titulo ? <title>{titulo}</title> : null}
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
