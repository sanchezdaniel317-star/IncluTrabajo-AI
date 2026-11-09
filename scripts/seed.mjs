// Carga los datos de demostración. `--reset` borra TODO y vuelve a sembrar (útil antes de una sustentación).
import { migrate, seedDemo } from "../db/migrate.js";
import { conectar } from "./conexion.mjs";

const reset = process.argv.includes("--reset");
const db = await conectar();
try {
  await migrate(db);
  const sembrado = await seedDemo(db, { reset });
  console.log(sembrado ? "Demo cargada. Contraseña de todas las cuentas: Demo2026!" : "La base ya tiene datos; no se sembró nada (usa --reset para reiniciar la demo).");
} finally {
  await db.cerrar();
}
