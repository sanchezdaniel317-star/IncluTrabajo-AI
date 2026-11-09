// Defensa contra CSRF (además de SameSite=Lax) y freno de fuerza bruta.

export function exigirMismoOrigen(request: Request) {
  if (request.method === "GET" || request.method === "HEAD") return;
  const origen = request.headers.get("Origin");
  if (!origen) return; // formularios sin JS de navegadores antiguos: la cookie SameSite=Lax ya protege
  const host = request.headers.get("X-Forwarded-Host") ?? request.headers.get("Host");
  let hostOrigen = "";
  try {
    hostOrigen = new URL(origen).host;
  } catch {
    hostOrigen = "";
  }
  if (!host || hostOrigen !== host) {
    throw new Response("Origen no permitido.", { status: 403 });
  }
}

const intentos = new Map<string, number[]>();
const VENTANA_MS = 10 * 60 * 1000;
const MAXIMO = 8;

export function ipDe(request: Request): string {
  return request.headers.get("X-Real-IP") ?? request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ?? "local";
}

/** Devuelve true si todavía se permite el intento. */
export function permitirIntento(clave: string): boolean {
  const ahora = Date.now();
  const lista = (intentos.get(clave) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (lista.length >= MAXIMO) {
    intentos.set(clave, lista);
    return false;
  }
  lista.push(ahora);
  intentos.set(clave, lista);
  if (intentos.size > 5000) intentos.clear();
  return true;
}

export function limpiarIntentos(clave: string) {
  intentos.delete(clave);
}

/** Solo rutas internas como destino de redirección (evita redirecciones abiertas). */
export function destinoSeguro(valor: FormDataEntryValue | string | null | undefined, porDefecto: string): string {
  const v = typeof valor === "string" ? valor : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : porDefecto;
}
