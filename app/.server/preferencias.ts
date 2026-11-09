import { createCookie } from "react-router";

// Preferencias de accesibilidad: viven en una cookie para que el servidor pinte la página
// ya ajustada (sin parpadeo) y funcionen sin JavaScript ni cuenta.
import { OPCIONES_PREFERENCIAS as OPCIONES, PREFERENCIAS_BASE, type Preferencias } from "~/lib/preferencias";
export { PREFERENCIAS_BASE, type Preferencias };

const cookie = createCookie("it_prefs", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365, httpOnly: false });

function limpiar(valor: unknown): Preferencias {
  const p = { ...PREFERENCIAS_BASE };
  if (valor && typeof valor === "object") {
    for (const k of Object.keys(OPCIONES) as (keyof Preferencias)[]) {
      const v = (valor as Record<string, unknown>)[k];
      if ((OPCIONES[k] as readonly unknown[]).includes(v)) (p as any)[k] = v;
    }
  }
  return p;
}

export async function leerPreferencias(request: Request): Promise<Preferencias> {
  try {
    return limpiar(await cookie.parse(request.headers.get("Cookie")));
  } catch {
    return { ...PREFERENCIAS_BASE };
  }
}

export async function guardarPreferencias(form: FormData, actuales: Preferencias): Promise<{ prefs: Preferencias; header: string }> {
  const entrada: Record<string, unknown> = { ...actuales };
  if (form.get("restablecer") === "1") {
    return { prefs: { ...PREFERENCIAS_BASE }, header: await cookie.serialize(PREFERENCIAS_BASE) };
  }
  for (const k of Object.keys(OPCIONES)) {
    const v = form.get(k);
    if (typeof v === "string") entrada[k] = v;
  }
  const prefs = limpiar(entrada);
  return { prefs, header: await cookie.serialize(prefs) };
}
