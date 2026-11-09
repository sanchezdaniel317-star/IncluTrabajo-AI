// Vocabulario compartido entre servidor y cliente. Lenguaje claro, español de Colombia.

export const MODALIDADES = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto",
} as const;
export type Modalidad = keyof typeof MODALIDADES;

export const MODALIDADES_PREF = { ...MODALIDADES, cualquiera: "Cualquiera" } as const;
export type ModalidadPref = keyof typeof MODALIDADES_PREF;

export const JORNADAS = {
  completa: "Tiempo completo",
  medio_tiempo: "Medio tiempo",
} as const;
export type Jornada = keyof typeof JORNADAS;

export const JORNADAS_PREF = { ...JORNADAS, cualquiera: "Cualquiera" } as const;
export type JornadaPref = keyof typeof JORNADAS_PREF;

export const PRIORIDADES = {
  3: { nombre: "Esencial", ayuda: "Sin esto no puedo trabajar." },
  2: { nombre: "Importante", ayuda: "Me ayuda mucho." },
  1: { nombre: "Deseable", ayuda: "Sería bueno tenerlo." },
} as const;
export type Prioridad = 1 | 2 | 3;

export const ESTADOS_AJUSTE = {
  verificado: { nombre: "Verificado", ayuda: "Nuestro equipo lo revisó en el puesto." },
  declarado: { nombre: "Declarado", ayuda: "Lo dice la empresa; aún sin verificar." },
  ajustable: { nombre: "Se puede ajustar", ayuda: "La empresa se compromete a tenerlo en una fecha." },
} as const;
export type EstadoAjuste = keyof typeof ESTADOS_AJUSTE;

export const ESTADOS_POSTULACION = {
  postulada: "Postulada",
  en_revision: "En revisión",
  entrevista: "Entrevista",
  contratada: "Contratada",
  no_seleccionada: "No seleccionada",
  retirada: "Retirada",
} as const;
export type EstadoPostulacion = keyof typeof ESTADOS_POSTULACION;

export const PASOS_POSTULACION: EstadoPostulacion[] = ["postulada", "en_revision", "entrevista", "contratada"];

export const TRANSICIONES: Record<EstadoPostulacion, EstadoPostulacion[]> = {
  postulada: ["en_revision", "entrevista", "no_seleccionada"],
  en_revision: ["entrevista", "no_seleccionada"],
  entrevista: ["contratada", "no_seleccionada"],
  contratada: [],
  no_seleccionada: [],
  retirada: [],
};

export const ESTADOS_FINALES: EstadoPostulacion[] = ["contratada", "no_seleccionada", "retirada"];

// Seis dominios del Grupo de Washington (lista corta). La respuesta solo sugiere ajustes.
export const DOMINIOS = [
  { clave: "ver", pregunta: "¿Tienes dificultad para ver, aun con gafas?", sugiere: ["lector_pantalla", "ampliacion"] },
  { clave: "oir", pregunta: "¿Tienes dificultad para oír, aun con audífonos?", sugiere: ["interprete_lsc", "subtitulos"] },
  { clave: "caminar", pregunta: "¿Tienes dificultad para caminar o subir escaleras?", sugiere: ["rampa", "ascensor", "puesto_adaptado", "teletrabajo"] },
  { clave: "recordar", pregunta: "¿Tienes dificultad para recordar o concentrarte?", sugiere: ["lenguaje_sencillo", "ambiente_tranquilo", "horario_flexible"] },
  { clave: "autocuidado", pregunta: "¿Tienes dificultad para el cuidado personal, como vestirte o bañarte?", sugiere: ["bano_accesible", "horario_flexible"] },
  { clave: "comunicarse", pregunta: "¿Tienes dificultad para comunicarte o para que te entiendan?", sugiere: ["subtitulos", "lenguaje_sencillo"] },
] as const;
export type ClaveDominio = (typeof DOMINIOS)[number]["clave"];

export const NIVELES_DIFICULTAD = {
  1: "No",
  2: "Sí, alguna",
  3: "Sí, mucha",
  4: "No puedo hacerlo",
} as const;

export function cop(valor: number): string {
  return "$" + Math.round(valor).toLocaleString("es-CO");
}

export function fecha(valor: string | Date | null | undefined): string {
  if (!valor) return "";
  const d = typeof valor === "string" ? new Date(valor.length === 10 ? valor + "T12:00:00" : valor) : valor;
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}
