// Motor de emparejamiento explicable (v3).
//   S = 100 · [0,40·C + 0,30·A + 0,15·U + 0,15·W]
//   C = competencias requeridas que la persona tiene / requeridas
//   A = Σ wᵢ·vᵢ / Σ wᵢ   (w: esencial 3, importante 2, deseable 1;
//                         v: verificado 1, declarado 0,7, ajustable 0,5, no ofrece 0)
//   U = ubicación y modalidad;  W = ⅔ salario + ⅓ jornada
// Un ajuste esencial que el puesto no ofrece marca «Falta un ajuste esencial».
// Nunca recibe ni usa la condición, el diagnóstico, la edad, el sexo, la etnia ni la nacionalidad.
import { fecha, type EstadoAjuste, type JornadaPref, type ModalidadPref, type Prioridad } from "./catalogo";

export const VERSION = "v3";
export const PESOS = { competencias: 40, ajustes: 30, lugar: 15, condiciones: 15 } as const;
export const FACTOR_ESTADO: Record<EstadoAjuste, number> = { verificado: 1, declarado: 0.7, ajustable: 0.5 };
const PESO_PRIORIDAD: Record<Prioridad, number> = { 3: 3, 2: 2, 1: 1 };

export interface PersonaParaMatch {
  ciudad: string;
  modalidad_pref: ModalidadPref;
  jornada_pref: JornadaPref;
  salario_min: number;
  competencias: { id: number; nombre: string }[];
  ajustes: { id: number; nombre: string; prioridad: Prioridad }[];
}

export interface VacanteParaMatch {
  ciudad: string;
  modalidad: "presencial" | "hibrido" | "remoto";
  jornada: "completa" | "medio_tiempo";
  salario: number;
  requisitos: { id: number; nombre: string }[];
  ajustes: {
    id: number;
    nombre: string;
    estado: EstadoAjuste;
    evidencia?: string | null;
    verificado_en?: string | null;
    compromiso_en?: string | null;
  }[];
}

export type EstadoFila = "si" | "parte" | "no" | "sin_datos";
export interface Fila {
  criterio: "competencias" | "ajuste" | "lugar" | "condiciones";
  estado: EstadoFila;
  frase: string;
  detalle: string;
  /** Solo en filas de ajuste que el puesto ofrece: cómo lo sabemos. */
  ajuste?: EstadoAjuste;
}

export type Nivel = "alta" | "media" | "baja" | "falta_esencial";
export const ETIQUETA_NIVEL: Record<Nivel, string> = {
  alta: "Encaja mucho",
  media: "Encaja en parte",
  baja: "Encaja poco",
  falta_esencial: "Falta un ajuste esencial",
};

export interface Resultado {
  puntaje: number;
  nivel: Nivel;
  etiqueta: string;
  compatible: boolean;
  confianza: "alta" | "media" | "baja";
  desglose: Record<keyof typeof PESOS, { obtenido: number; maximo: number }>;
  filas: Fila[];
  version: string;
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

// Minúscula inicial dentro de una frase, salvo nombres propios (Excel, Inglés, Power BI…).
const PROPIOS = /^(excel|ingl[eé]s|power bi|react|sql|lengua de señas)/i;
export function enFrase(nombre: string): string {
  return PROPIOS.test(nombre) ? nombre : nombre.charAt(0).toLowerCase() + nombre.slice(1);
}

function lista(nombres: string[]): string {
  if (nombres.length <= 1) return nombres.join("");
  return nombres.slice(0, -1).join(", ") + " y " + nombres[nombres.length - 1];
}

/** `voz`: «persona» le habla a quien busca empleo; «empresa» describe a la persona en tercera persona. */
export function emparejar(p: PersonaParaMatch, v: VacanteParaMatch, voz: "persona" | "empresa" = "persona"): Resultado {
  const T = (aPersona: string, aEmpresa: string) => (voz === "empresa" ? aEmpresa : aPersona);
  const filas: Fila[] = [];
  let sinDatos = 0;
  let bloqueado = false;

  // 1. Competencias (40)
  let C = 0;
  if (v.requisitos.length === 0) {
    sinDatos++;
    filas.push({ criterio: "competencias", estado: "sin_datos", frase: T("La empresa no dijo qué competencias pide.", "La vacante no dice qué competencias pide."), detalle: T("Este criterio queda en espera.", "Agrégalas para calcular este criterio.") });
  } else if (p.competencias.length === 0) {
    sinDatos++;
    filas.push({ criterio: "competencias", estado: "sin_datos", frase: T("Aún no nos contaste lo que sabes hacer.", "La persona aún no registró sus competencias."), detalle: T("Agrega tus competencias en tu perfil.", "El puntaje es preliminar.") });
  } else {
    const tiene = new Set(p.competencias.map((c) => c.id));
    const cubre = v.requisitos.filter((r) => tiene.has(r.id));
    const faltan = v.requisitos.filter((r) => !tiene.has(r.id));
    C = cubre.length / v.requisitos.length;
    const n = `${cubre.length} de ${v.requisitos.length}`;
    if (faltan.length === 0) {
      filas.push({ criterio: "competencias", estado: "si", frase: T("Sabes lo que pide el puesto.", "Tiene lo que pide el puesto."), detalle: `${n}: ${lista(cubre.map((c) => enFrase(c.nombre)))}.` });
    } else if (cubre.length > 0) {
      filas.push({ criterio: "competencias", estado: "parte", frase: T("Sabes parte de lo que pide el puesto.", "Tiene parte de lo que pide el puesto."), detalle: `${n}. ${T("Te falta", "Le falta")}: ${lista(faltan.map((c) => enFrase(c.nombre)))}.` });
    } else {
      filas.push({ criterio: "competencias", estado: "no", frase: T("Todavía no tienes lo que pide el puesto.", "Todavía no tiene lo que pide el puesto."), detalle: `Pide: ${lista(faltan.map((c) => enFrase(c.nombre)))}.` });
    }
  }

  // 2. Ajustes razonables (30)
  let A = 1;
  if (p.ajustes.length > 0) {
    const ofrece = new Map(v.ajustes.map((a) => [a.id, a]));
    let suma = 0;
    let total = 0;
    const ordenados = [...p.ajustes].sort((a, b) => b.prioridad - a.prioridad);
    for (const aj of ordenados) {
      const w = PESO_PRIORIDAD[aj.prioridad];
      total += w;
      const o = ofrece.get(aj.id);
      const nombre = enFrase(aj.nombre);
      if (!o) {
        if (aj.prioridad === 3) bloqueado = true;
        filas.push({
          criterio: "ajuste",
          estado: "no",
          frase: T(`No ofrece ${nombre}.`, `Necesita ${nombre} y el puesto no lo ofrece.`),
          detalle: aj.prioridad === 3 ? T("Lo marcaste como esencial. Puedes preguntarle a la empresa si lo puede ajustar.", "Es esencial para la persona. Si lo puedes ajustar, márcalo en la vacante.") : T("Puedes preguntarle a la empresa si lo puede ajustar.", "Considera si lo puedes ajustar."),
        });
        continue;
      }
      suma += w * FACTOR_ESTADO[o.estado];
      if (o.estado === "verificado") {
        filas.push({ criterio: "ajuste", estado: "si", ajuste: "verificado", frase: T(`Tiene ${nombre}.`, `Necesita ${nombre}: el puesto lo tiene.`), detalle: `Verificado en visita técnica${o.verificado_en ? " el " + fecha(o.verificado_en) : ""}.` });
      } else if (o.estado === "declarado") {
        filas.push({ criterio: "ajuste", estado: "parte", ajuste: "declarado", frase: T(`Dice que tiene ${nombre}.`, `Necesita ${nombre}: lo declaraste.`), detalle: T("Lo dice la empresa; aún sin verificar.", "Aún sin verificar en el puesto.") });
      } else {
        filas.push({ criterio: "ajuste", estado: "parte", ajuste: "ajustable", frase: T(`Se compromete a tener ${nombre}.`, `Necesita ${nombre}: te comprometiste a tenerlo.`), detalle: o.compromiso_en ? `Antes del ${fecha(o.compromiso_en)}.` : "En una fecha acordada." });
      }
    }
    A = total ? suma / total : 1;
  } else {
    filas.push({ criterio: "ajuste", estado: "si", frase: T("No marcaste ajustes que necesites.", "No registró ajustes que necesite."), detalle: T("Si necesitas alguno, agrégalo en tu perfil.", "Si los necesita, puede agregarlos después.") });
  }

  // 3. Lugar y modalidad (15)
  const mismaCiudad = norm(p.ciudad) === norm(v.ciudad);
  let U = 0;
  const modo = v.modalidad;
  const modoTxt = { presencial: "presencial", hibrido: "híbrido", remoto: "remoto" }[modo];
  if (p.modalidad_pref === "cualquiera" || p.modalidad_pref === modo) {
    if (modo === "remoto" || mismaCiudad) {
      U = 1;
      filas.push({ criterio: "lugar", estado: "si", frase: modo === "remoto" ? T("Es remoto: trabajas desde donde estés.", "Es remoto: puede trabajar desde donde esté.") : T(`Queda en ${v.ciudad} y es ${modoTxt}.`, `Vive en ${p.ciudad} y la modalidad le sirve.`), detalle: p.modalidad_pref === "cualquiera" ? T("Aceptas cualquier modalidad.", "Acepta cualquier modalidad.") : T("Como prefieres.", "Como prefiere.") });
    } else {
      U = p.modalidad_pref === "cualquiera" ? 8 / 15 : 7 / 15;
      filas.push({ criterio: "lugar", estado: "parte", frase: T(`Es en ${v.ciudad}; tú estás en ${p.ciudad}.`, `Vive en ${p.ciudad}; la vacante es en ${v.ciudad}.`), detalle: T(`La modalidad (${modoTxt}) sí te sirve.`, `La modalidad (${modoTxt}) sí le sirve.`) });
    }
  } else {
    const prefTxt = { presencial: "presencial", hibrido: "híbrido", remoto: "remoto", cualquiera: "cualquiera" }[p.modalidad_pref];
    filas.push({ criterio: "lugar", estado: "no", frase: T(`Es ${modoTxt} y prefieres ${prefTxt}.`, `Prefiere ${prefTxt} y la vacante es ${modoTxt}.`), detalle: mismaCiudad ? T(`Queda en tu ciudad (${v.ciudad}).`, `Vive en ${v.ciudad}.`) : `${T("Queda en", "La vacante es en")} ${v.ciudad}.` });
  }

  // 4. Salario y jornada (15 = 10 + 5)
  let W = 0;
  const salarioOk = p.salario_min > 0 && v.salario >= p.salario_min;
  const jornadaOk = p.jornada_pref === "cualquiera" || p.jornada_pref === v.jornada;
  if (p.salario_min <= 0) sinDatos += 0; // no regalamos puntos: el salario queda en 0 si no hay aspiración
  W = (salarioOk ? 2 / 3 : 0) + (jornadaOk ? 1 / 3 : 0);
  const jTxt = v.jornada === "completa" ? "tiempo completo" : "medio tiempo";
  if (salarioOk && jornadaOk) {
    filas.push({ criterio: "condiciones", estado: "si", frase: T("El salario y la jornada te sirven.", "El salario y la jornada le sirven."), detalle: T(`Paga lo que esperas y es de ${jTxt}.`, `Cubre su aspiración y es de ${jTxt}.`) });
  } else if (salarioOk || jornadaOk) {
    filas.push({
      criterio: "condiciones",
      estado: "parte",
      frase: salarioOk ? T(`El salario te sirve; la jornada es de ${jTxt}.`, `El salario le sirve; prefiere otra jornada.`) : p.salario_min <= 0 ? T("No nos dijiste cuánto esperas ganar.", "No registró su aspiración salarial.") : T("El salario es menor de lo que esperas.", "El salario es menor que su aspiración."),
      detalle: salarioOk ? T("Revisa si puedes con ese horario.", "Conversa el horario en la entrevista.") : p.salario_min <= 0 ? T("Agrega tu aspiración salarial en tu perfil.", "Conversa el salario en la entrevista.") : "Puede conversarse en la entrevista.",
    });
  } else {
    filas.push({ criterio: "condiciones", estado: "no", frase: T("El salario y la jornada no son los que buscas.", "El salario y la jornada no son los que busca."), detalle: `Es de ${jTxt}.` });
  }

  const desglose = {
    competencias: { obtenido: C * PESOS.competencias, maximo: PESOS.competencias },
    ajustes: { obtenido: A * PESOS.ajustes, maximo: PESOS.ajustes },
    lugar: { obtenido: U * PESOS.lugar, maximo: PESOS.lugar },
    condiciones: { obtenido: W * PESOS.condiciones, maximo: PESOS.condiciones },
  };
  const puntaje = Math.max(0, Math.min(100, Math.round(desglose.competencias.obtenido + desglose.ajustes.obtenido + desglose.lugar.obtenido + desglose.condiciones.obtenido)));
  const nivel: Nivel = bloqueado ? "falta_esencial" : puntaje >= 80 ? "alta" : puntaje >= 55 ? "media" : "baja";
  return {
    puntaje,
    nivel,
    etiqueta: ETIQUETA_NIVEL[nivel],
    compatible: !bloqueado && puntaje >= 55,
    confianza: sinDatos >= 2 ? "baja" : sinDatos === 1 ? "media" : "alta",
    desglose,
    filas,
    version: VERSION,
  };
}

/** Texto continuo para escuchar la explicación con voz. */
export function explicacionEnVoz(cargo: string, r: Resultado): string {
  return [`${cargo}. ${r.etiqueta}: ${r.puntaje} de 100.`, ...r.filas.map((f) => `${f.frase} ${f.detalle}`)].join(" ");
}
