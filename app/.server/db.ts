// Acceso a datos. Producción: PostgreSQL vía `pg` (DATABASE_URL).
// Desarrollo y pruebas: PGlite (PostgreSQL en WASM) en `.data/pglite`, sin instalar nada.
import { migrate, seedDemo } from "../../db/migrate.js";

export type Row = Record<string, any>;
export interface Queryable {
  query<T = Row>(sql: string, params?: unknown[]): Promise<T[]>;
}
export interface Db extends Queryable {
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
}

async function crearPg(url: string): Promise<Db> {
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  return {
    async query(sql, params = []) {
      return (await pool.query(sql, params as any[])).rows;
    },
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        const out = await fn({ query: async (s, p = []) => (await client.query(s, p as any[])).rows });
        await client.query("commit");
        return out;
      } catch (e) {
        await client.query("rollback");
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

async function crearPglite(dir: string | undefined): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  if (dir) (await import("node:fs")).mkdirSync(dir, { recursive: true });
  const db = dir ? new PGlite(dir) : new PGlite();
  await db.waitReady;
  const exec = async (sql: string) => {
    await db.exec(sql);
  };
  const query = async (sql: string, params: unknown[] = []) => (await db.query(sql, params as any[])).rows as any[];
  // Desarrollo sin configuración: crea el esquema y siembra la demo la primera vez.
  await migrate({ exec, query });
  await seedDemo({ exec, query });
  return {
    query,
    async tx(fn) {
      return db.transaction(async (t) => fn({ query: async (s, p = []) => (await t.query(s, p as any[])).rows as any[] }));
    },
  };
}

const g = globalThis as unknown as { __inclutrabajoDb?: Promise<Db> };

export function db(): Promise<Db> {
  if (!g.__inclutrabajoDb) {
    const url = process.env.DATABASE_URL;
    g.__inclutrabajoDb = (url
      ? crearPg(url)
      : crearPglite(process.env.PGLITE_DIR === "memory" ? undefined : process.env.PGLITE_DIR ?? ".data/pglite")
    ).catch((e) => {
      g.__inclutrabajoDb = undefined; // el siguiente intento vuelve a conectar
      throw e;
    });
  }
  return g.__inclutrabajoDb;
}

export async function q<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await db()).query<T>(sql, params);
}

export async function q1<T = Row>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return (await q<T>(sql, params))[0];
}
