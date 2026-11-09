import { describe, expect, it } from "vitest";
import { emparejar, type PersonaParaMatch, type VacanteParaMatch } from "../../app/lib/matching";
import { cuotaLey2466, calcularCumplimiento, baseAnualPorPersona } from "../../app/lib/cumplimiento";
import { calcularIap } from "../../app/lib/iap";

const ana: PersonaParaMatch = {
  ciudad: "Cartagena",
  modalidad_pref: "hibrido",
  jornada_pref: "completa",
  salario_min: 1_800_000,
  competencias: [
    { id: 1, nombre: "Atención al cliente" },
    { id: 2, nombre: "Excel" },
  ],
  ajustes: [
    { id: 5, nombre: "Lector de pantalla", prioridad: 3 },
    { id: 10, nombre: "Horario flexible", prioridad: 2 },
  ],
};

const auxiliar: VacanteParaMatch = {
  ciudad: "Cartagena",
  modalidad: "hibrido",
  jornada: "completa",
  salario: 1_900_000,
  requisitos: [
    { id: 1, nombre: "Atención al cliente" },
    { id: 2, nombre: "Excel" },
  ],
  ajustes: [
    { id: 5, nombre: "Lector de pantalla", estado: "verificado", verificado_en: "2026-10-14" },
    { id: 10, nombre: "Horario flexible", estado: "declarado" },
  ],
};

describe("motor de emparejamiento v3", () => {
  it("aplica la fórmula con factor de verificación", () => {
    const r = emparejar(ana, auxiliar);
    // A = (3·1 + 2·0,7) / 5 = 0,88 → 26,4 ; C 40 ; U 15 ; W 15 → 96
    expect(r.puntaje).toBe(96);
    expect(r.nivel).toBe("alta");
    expect(r.compatible).toBe(true);
    expect(r.desglose.ajustes.obtenido).toBeCloseTo(26.4, 5);
  });

  it("marca falta de ajuste esencial aunque el puntaje sea alto", () => {
    const sinLector = { ...auxiliar, ajustes: [{ id: 10, nombre: "Horario flexible", estado: "verificado" as const }] };
    const r = emparejar(ana, sinLector);
    expect(r.nivel).toBe("falta_esencial");
    expect(r.compatible).toBe(false);
    expect(r.filas.some((f) => f.estado === "no" && f.criterio === "ajuste")).toBe(true);
  });

  it("sin ajustes declarados no penaliza", () => {
    const r = emparejar({ ...ana, ajustes: [] }, auxiliar);
    expect(r.desglose.ajustes.obtenido).toBe(30);
  });

  it("no regala puntos sin datos", () => {
    const r = emparejar({ ...ana, competencias: [], salario_min: 0 }, { ...auxiliar, requisitos: [] });
    expect(r.desglose.competencias.obtenido).toBe(0);
    expect(r.confianza).toBe("media");
  });

  it("evalúa modalidad y ciudad", () => {
    expect(emparejar({ ...ana, ciudad: "Bogotá" }, auxiliar).desglose.lugar.obtenido).toBeCloseTo(7, 5);
    expect(emparejar({ ...ana, modalidad_pref: "remoto" }, auxiliar).desglose.lugar.obtenido).toBe(0);
    expect(emparejar({ ...ana, ciudad: "Lima", modalidad_pref: "cualquiera" }, { ...auxiliar, modalidad: "remoto" }).desglose.lugar.obtenido).toBe(15);
    expect(emparejar({ ...ana, ciudad: "Lima" }, { ...auxiliar, modalidad: "remoto" }).desglose.lugar.obtenido).toBe(0);
  });

  it("nunca usa atributos protegidos: la entrada ni siquiera los admite", () => {
    const conExtra = { ...ana, edad: 52, sexo: "F", discapacidad: "visual" } as unknown as PersonaParaMatch;
    expect(emparejar(conExtra, auxiliar).puntaje).toBe(emparejar(ana, auxiliar).puntaje);
  });

  it("la voz de empresa cambia el texto, nunca el puntaje", () => {
    const p = emparejar(ana, auxiliar);
    const e = emparejar(ana, auxiliar, "empresa");
    expect(e.puntaje).toBe(p.puntaje);
    expect(e.filas[0].frase).toBe("Tiene lo que pide el puesto.");
    expect(e.filas.every((f) => !/\b(sabes|tienes|prefieres|te sirve)\b/i.test(f.frase))).toBe(true);
  });

  it("explica cada criterio con una frase", () => {
    const r = emparejar(ana, auxiliar);
    expect(r.filas.map((f) => f.criterio)).toEqual(["competencias", "ajuste", "ajuste", "lugar", "condiciones"]);
    expect(r.filas.every((f) => f.frase.length > 0 && !/no apto/i.test(f.frase + f.detalle))).toBe(true);
  });
});

describe("cuota Ley 2466 de 2025", () => {
  it.each([
    [0, 0], [99, 0], [100, 2], [199, 2], [250, 4], [500, 10], [501, 10], [600, 11], [1250, 17],
  ])("%i trabajadores → %i personas", (n, esperado) => {
    expect(cuotaLey2466(n)).toBe(esperado);
  });

  it("calcula brecha y ahorro estimado", () => {
    const c = calcularCumplimiento({ trabajadores: 300, vinculadas: 1 });
    expect(c.cuota).toBe(6);
    expect(c.brecha).toBe(5);
    expect(Math.round(c.basePorPersona)).toBe(Math.round(baseAnualPorPersona(1_750_905)));
    expect(Math.round(c.ahorroAnual / 1e6)).toBe(38); // ≈ $38,4 M (Taller 10)
  });
});

describe("Índice de Accesibilidad del Puesto", () => {
  it("pondera y categoriza", () => {
    const r = calcularIap({ acceso: 1, bano: 1, mobiliario: 0.5, ambiente: 1, senalizacion: 0.5, digital: 1, organizacional: 1 });
    expect(r?.valor).toBe(88);
    expect(r?.categoria).toBe("A");
  });
  it("devuelve null sin criterios", () => {
    expect(calcularIap({})).toBeNull();
  });
});
