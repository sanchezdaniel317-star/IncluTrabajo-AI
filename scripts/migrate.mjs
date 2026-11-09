// Aplica las migraciones pendientes. Con DATABASE_URL usa PostgreSQL; sin ella, PGlite en .data/pglite.
import { migrate } from "../db/migrate.js";
import { conectar } from "./conexion.mjs";

const db = await conectar();
try {
  const aplicadas = await migrate(db);
  console.log(aplicadas.length ? `Aplicadas: ${aplicadas.join(", ")}` : "Sin migraciones pendientes.");
} finally {
  await db.cerrar();
}
