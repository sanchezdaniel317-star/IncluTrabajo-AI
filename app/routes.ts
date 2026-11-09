import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("vacantes", "routes/vacantes.tsx"),
  route("vacantes/:id", "routes/vacante.tsx"),
  route("ingresar", "routes/ingresar.tsx"),
  route("registro", "routes/registro.tsx"),
  route("salir", "routes/salir.tsx"),
  route("preferencias", "routes/preferencias.tsx"),
  route("accesibilidad", "routes/accesibilidad.tsx"),
  route("privacidad", "routes/privacidad.tsx"),
  route("avisos", "routes/avisos.tsx"),

  route("persona", "routes/persona/inicio.tsx"),
  route("persona/perfil", "routes/persona/perfil.tsx"),
  route("persona/coincidencias", "routes/persona/coincidencias.tsx"),
  route("persona/postulaciones", "routes/persona/postulaciones.tsx"),

  route("empresa", "routes/empresa/inicio.tsx"),
  route("empresa/vacantes/nueva", "routes/empresa/vacante-form.tsx", { id: "vacante-nueva" }),
  route("empresa/vacantes/:id", "routes/empresa/vacante-form.tsx", { id: "vacante-editar" }),
  route("empresa/vacantes/:id/candidaturas", "routes/empresa/candidaturas.tsx"),
  route("empresa/cumplimiento", "routes/empresa/cumplimiento.tsx"),

  route("*", "routes/no-encontrada.tsx"),
] satisfies RouteConfig;
