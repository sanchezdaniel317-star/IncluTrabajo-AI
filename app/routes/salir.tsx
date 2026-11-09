import { redirect } from "react-router";
import type { Route } from "./+types/salir";
import { cerrarSesion } from "~/.server/sesion";
import { exigirMismoOrigen } from "~/.server/seguridad";

export async function action({ request }: Route.ActionArgs) {
  exigirMismoOrigen(request);
  return cerrarSesion(request);
}

export function loader() {
  return redirect("/");
}
