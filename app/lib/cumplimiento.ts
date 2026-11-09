// Cuota de contratación (Ley 2466 de 2025) y deducción en renta (Ley 361 de 1997, art. 31).
// La regla de tramos es una interpretación preliminar mientras sale el decreto reglamentario.

export const PARAMETROS_2026 = {
  smmlv: 1_750_905,
  auxilioTransporte: 249_095,
  tarifaRenta: 0.35,
  prestaciones: 0.0833 + 0.01 + 0.0833, // cesantías + intereses + prima (sobre salario + auxilio)
  vacaciones: 0.0417,
} as const;

export function cuotaLey2466(trabajadores: number): number {
  const n = Math.max(0, Math.floor(trabajadores || 0));
  if (n < 100) return 0;
  if (n <= 500) return 2 * Math.floor(n / 100);
  return 10 + Math.floor((n - 500) / 100);
}

export function baseAnualPorPersona(salario: number, p = PARAMETROS_2026): number {
  const auxilio = salario <= 2 * p.smmlv ? p.auxilioTransporte : 0;
  return 12 * salario + 12 * (salario + auxilio) * p.prestaciones + 12 * salario * p.vacaciones;
}

export interface Cumplimiento {
  cuota: number;
  vinculadas: number;
  brecha: number;
  cumple: boolean;
  obligada: boolean;
  ahorroAnual: number;
  basePorPersona: number;
}

export function calcularCumplimiento(input: {
  trabajadores: number;
  vinculadas: number;
  salario?: number;
  proporcionElegible?: number;
}): Cumplimiento {
  const cuota = cuotaLey2466(input.trabajadores);
  const vinculadas = Math.max(0, Math.floor(input.vinculadas || 0));
  const brecha = Math.max(0, cuota - vinculadas);
  const salario = input.salario && input.salario > 0 ? input.salario : PARAMETROS_2026.smmlv;
  const proporcion = Math.min(1, Math.max(0, input.proporcionElegible ?? 0.7));
  const base = baseAnualPorPersona(salario);
  const personas = Math.max(cuota, vinculadas);
  return {
    cuota,
    vinculadas,
    brecha,
    cumple: brecha === 0,
    obligada: cuota > 0,
    ahorroAnual: personas * proporcion * base * PARAMETROS_2026.tarifaRenta,
    basePorPersona: base,
  };
}
