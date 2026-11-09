// Conexión para los scripts de línea de comandos (misma regla que la app).
import { mkdirSync } from "node:fs";

export async function conectar() {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    return {
      exec: async (sql) => {
        await client.query(sql);
      },
      query: async (sql, params = []) => (await client.query(sql, params)).rows,
      cerrar: () => client.end(),
    };
  }
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  mkdirSync(dir, { recursive: true });
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(dir);
  await db.waitReady;
  return {
    exec: async (sql) => {
      await db.exec(sql);
    },
    query: async (sql, params = []) => (await db.query(sql, params)).rows,
    cerrar: () => db.close(),
  };
}
