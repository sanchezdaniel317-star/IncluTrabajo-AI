import { data, redirect } from "react-router";
import type { Route } from "./+types/preferencias";
import { guardarPreferencias, leerPreferencias } from "~/.server/preferencias";
import { destinoSeguro, exigirMismoOrigen } from "~/.server/seguridad";

export async function action({ request }: Route.ActionArgs) {
  exigirMismoOrigen(request);
  const form = await request.formData();
  const { prefs, header } = await guardarPreferencias(form, await leerPreferencias(request));
  // Con JavaScript (fetcher) respondemos sin recargar; sin JavaScript volvemos a la página de origen.
  if (request.headers.get("Accept")?.includes("text/html") === false || form.get("modo") === "fetch") {
    return data({ prefs }, { headers: { "Set-Cookie": header } });
  }
  return redirect(destinoSeguro(form.get("volver"), "/"), { headers: { "Set-Cookie": header } });
}

export function loader() {
  return redirect("/accesibilidad");
}
