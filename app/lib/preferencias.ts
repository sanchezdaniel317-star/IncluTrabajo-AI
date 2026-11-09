export interface Preferencias {
  texto: "normal" | "grande" | "enorme";
  contraste: "normal" | "alto";
  letra: "estandar" | "legible";
  espaciado: "normal" | "amplio";
  movimiento: "auto" | "reducido";
}

export const PREFERENCIAS_BASE: Preferencias = {
  texto: "normal",
  contraste: "normal",
  letra: "estandar",
  espaciado: "normal",
  movimiento: "auto",
};

export const OPCIONES_PREFERENCIAS: { [K in keyof Preferencias]: readonly Preferencias[K][] } = {
  texto: ["normal", "grande", "enorme"],
  contraste: ["normal", "alto"],
  letra: ["estandar", "legible"],
  espaciado: ["normal", "amplio"],
  movimiento: ["auto", "reducido"],
};
