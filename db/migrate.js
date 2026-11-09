// Aplicador de migraciones compartido por la app y por scripts/migrate.mjs.
// `exec(sql)` ejecuta un archivo SQL completo; `query(sql, params)` devuelve filas.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Se resuelve desde la raíz del proyecto (donde corre el servicio), no desde el archivo empaquetado.
const RAIZ_DB = process.env.DB_DIR ?? path.join(process.cwd(), "db");
const DIR = path.join(RAIZ_DB, "migrations");

export async function migrate({ exec, query }) {
  await exec(
    "create table if not exists schema_migrations (nombre text primary key, aplicada_en timestamptz not null default now())",
  );
  const hechas = new Set((await query("select nombre from schema_migrations")).map((f) => f.nombre));
  const archivos = (await readdir(DIR)).filter((f) => f.endsWith(".sql")).sort();
  const aplicadas = [];
  for (const archivo of archivos) {
    if (hechas.has(archivo)) continue;
    const sql = await readFile(path.join(DIR, archivo), "utf8");
    await exec(`begin;\n${sql}\ninsert into schema_migrations (nombre) values ('${archivo.replace(/'/g, "''")}');\ncommit;`);
    aplicadas.push(archivo);
  }
  return aplicadas;
}

export async function seedDemo({ exec, query }, { reset = false } = {}) {
  const sql = await readFile(path.join(RAIZ_DB, "seed", "demo.sql"), "utf8");
  if (reset) {
    await exec(
      "truncate avisos, postulacion_eventos, postulaciones, vacante_iap, vacante_ajustes, vacante_competencias, vacantes, persona_ajustes, persona_competencias, empresas, personas, usuarios, ajustes, competencias restart identity cascade",
    );
  }
  const [{ total }] = await query("select count(*)::int as total from usuarios");
  if (total > 0 && !reset) return false;
  await exec(`begin;\n${sql}\ncommit;`);
  return true;
}
