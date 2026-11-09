// Índice de Accesibilidad del Puesto: IAP = 100 · Σ pⱼ·xⱼ / Σ pⱼ, con xⱼ ∈ {0; 0,5; 1}.

export const CRITERIOS_IAP = [
  { clave: "acceso", nombre: "Acceso y circulación", peso: 20, ayuda: "Rampa de máximo 8,33 %, puertas de 0,80 m, pasillos de 1,20 m." },
  { clave: "bano", nombre: "Baño accesible", peso: 10, ayuda: "Giro de silla de 1,50 m y barras de apoyo." },
  { clave: "mobiliario", nombre: "Puesto y mobiliario", peso: 15, ayuda: "Mesa de 0,73 a 0,80 m con espacio para las rodillas." },
  { clave: "ambiente", nombre: "Luz y ruido", peso: 10, ayuda: "500 lx en tareas de oficina; poco ruido." },
  { clave: "senalizacion", nombre: "Señalización y evacuación", peso: 10, ayuda: "Contraste, alto relieve y alarma visual y sonora." },
  { clave: "digital", nombre: "Accesibilidad digital", peso: 20, ayuda: "Programas compatibles con lector de pantalla; contraste 4,5:1." },
  { clave: "organizacional", nombre: "Organización del trabajo", peso: 15, ayuda: "Horario flexible, trabajo remoto, intérprete, instrucciones claras." },
] as const;
export type CriterioIap = (typeof CRITERIOS_IAP)[number]["clave"];

export const VALORES_IAP = [
  { valor: 1, nombre: "Cumple" },
  { valor: 0.5, nombre: "En parte" },
  { valor: 0, nombre: "No cumple" },
] as const;

export function calcularIap(valores: Partial<Record<CriterioIap, number>>) {
  let suma = 0;
  let total = 0;
  let evaluados = 0;
  for (const c of CRITERIOS_IAP) {
    const x = valores[c.clave];
    if (x === undefined || x === null || Number.isNaN(x)) continue;
    evaluados++;
    suma += c.peso * x;
    total += c.peso;
  }
  if (evaluados === 0) return null;
  const valor = Math.round((100 * suma) / total);
  const categoria = valor >= 85 ? "A" : valor >= 60 ? "B" : "C";
  const nombre = categoria === "A" ? "Accesible" : categoria === "B" ? "Accesible con ajustes" : "Requiere intervención";
  return { valor, categoria, nombre, completo: evaluados === CRITERIOS_IAP.length };
}
