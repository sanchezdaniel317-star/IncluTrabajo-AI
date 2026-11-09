// Flujos de punta a punta contra PostgreSQL real (PGlite en memoria) llamando loaders y actions.
import { beforeAll, describe, expect, it } from "vitest";

process.env.PGLITE_DIR = "memory";

const BASE = "http://inclutrabajo.test";
type Mod = { action?: (a: any) => any; loader?: (a: any) => any };

let rutas: Record<string, Mod>;
let q: (sql: string, p?: unknown[]) => Promise<any[]>;

beforeAll(async () => {
  const db = await import("../../app/.server/db");
  q = db.q;
  await db.db();
  rutas = {
    registro: await import("../../app/routes/registro"),
    ingresar: await import("../../app/routes/ingresar"),
    vacante: await import("../../app/routes/vacante"),
    postulaciones: await import("../../app/routes/persona/postulaciones"),
    candidaturas: await import("../../app/routes/empresa/candidaturas"),
    vacanteForm: await import("../../app/routes/empresa/vacante-form"),
  };
});

function form(campos: Record<string, string | string[]>) {
  const f = new URLSearchParams();
  for (const [k, v] of Object.entries(campos)) for (const x of Array.isArray(v) ? v : [v]) f.append(k, x);
  return f;
}

function post(ruta: string, campos: Record<string, string | string[]>, cookie?: string, origen = BASE) {
  return new Request(BASE + ruta, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Host: "inclutrabajo.test", Origin: origen, ...(cookie ? { Cookie: cookie } : {}) },
    body: form(campos),
  });
}

function get(ruta: string, cookie?: string) {
  return new Request(BASE + ruta, { headers: { Host: "inclutrabajo.test", ...(cookie ? { Cookie: cookie } : {}) } });
}

async function correr(fn: () => any): Promise<{ status: number; datos?: any; cookie?: string; ubicacion?: string }> {
  try {
    const r = await fn();
    if (r instanceof Response) {
      return { status: r.status, cookie: r.headers.get("Set-Cookie")?.split(";")[0], ubicacion: r.headers.get("Location") ?? undefined };
    }
    if (r && r.type === "DataWithResponseInit") return { status: r.init?.status ?? 200, datos: r.data };
    return { status: 200, datos: r };
  } catch (e) {
    if (e instanceof Response) return { status: e.status, ubicacion: e.headers.get("Location") ?? undefined };
    throw e;
  }
}

async function entrarDemo(id: number) {
  const r = await correr(() => rutas.ingresar.action!({ request: post("/ingresar", { demo: String(id) }), params: {}, context: {} }));
  expect(r.status).toBe(302);
  return r.cookie!;
}

describe("registro y acceso", () => {
  it("crea una persona SIN autorizar datos sensibles (Ley 1581: es opcional)", async () => {
    const r = await correr(() =>
      rutas.registro.action!({
        request: post("/registro", { rol: "persona", nombre: "Marta Ríos", email: "marta@example.com", clave: "unaFraseLarga", ciudad: "Cartagena", terminos: "si" }),
        params: {}, context: {},
      }),
    );
    expect(r.status).toBe(302);
    expect(r.cookie).toMatch(/__it_sesion=/);
    const [p] = await q("select comparte_ajustes from personas p join usuarios u on u.id = p.usuario_id where u.email = 'marta@example.com'");
    expect(p.comparte_ajustes).toBe(false);
  });

  it("exige aceptar la política de privacidad", async () => {
    const r = await correr(() =>
      rutas.registro.action!({ request: post("/registro", { rol: "persona", nombre: "Sin Términos", email: "st@example.com", clave: "unaFraseLarga", ciudad: "Cali" }), params: {}, context: {} }),
    );
    expect(r.status).toBe(400);
    expect(r.datos.errores.terminos).toBeTruthy();
  });

  it("rechaza contraseña incorrecta y acepta la correcta", async () => {
    const malo = await correr(() => rutas.ingresar.action!({ request: post("/ingresar", { email: "ana.torres@demo.co", clave: "otra" }), params: {}, context: {} }));
    expect(malo.status).toBe(401);
    const bien = await correr(() => rutas.ingresar.action!({ request: post("/ingresar", { email: "ana.torres@demo.co", clave: "Demo2026!" }), params: {}, context: {} }));
    expect(bien.status).toBe(302);
    expect(bien.ubicacion).toBe("/persona");
  });

  it("bloquea envíos desde otro origen (CSRF)", async () => {
    const r = await correr(() => rutas.ingresar.action!({ request: post("/ingresar", { demo: "1" }, undefined, "https://atacante.example"), params: {}, context: {} }));
    expect(r.status).toBe(403);
  });

  it("no redirige a sitios externos después de entrar", async () => {
    const r = await correr(() => rutas.ingresar.action!({ request: post("/ingresar", { demo: "1", volver: "//malo.example" }), params: {}, context: {} }));
    expect(r.ubicacion).toBe("/persona");
  });
});

describe("postulación", () => {
  it("postula, impide duplicar, retira y permite volver a postularse", async () => {
    const ana = await entrarDemo(1);
    const v = { request: post("/vacantes/2", {}, ana), params: { id: "2" }, context: {} };
    expect((await correr(() => rutas.vacante.action!(v))).status).toBe(302);
    expect((await correr(() => rutas.vacante.action!({ ...v, request: post("/vacantes/2", {}, ana) }))).status).toBe(409);
    const [p] = await q("select id from postulaciones where persona_id = 1 and vacante_id = 2");
    expect((await correr(() => rutas.postulaciones.action!({ request: post("/persona/postulaciones", { retirar: String(p.id) }, ana), params: {}, context: {} }))).status).toBe(302);
    expect((await q("select estado from postulaciones where id = $1", [p.id]))[0].estado).toBe("retirada");
    expect((await correr(() => rutas.vacante.action!({ ...v, request: post("/vacantes/2", {}, ana) }))).status).toBe(302);
    expect((await q("select estado from postulaciones where id = $1", [p.id]))[0].estado).toBe("postulada");
  });

  it("una empresa no puede postularse", async () => {
    const empresa = await entrarDemo(5);
    const r = await correr(() => rutas.vacante.action!({ request: post("/vacantes/2", {}, empresa), params: { id: "2" }, context: {} }));
    expect(r.status).toBe(302);
    expect(r.ubicacion).toBe("/empresa");
  });
});

describe("empresa", () => {
  it("respeta las transiciones y exige mensaje al no seleccionar", async () => {
    const tech = await entrarDemo(5);
    const [p] = await q("select id from postulaciones where persona_id = 1 and vacante_id = 1");
    const mover = (estado: string, comentario = "") =>
      correr(() => rutas.candidaturas.action!({ request: post("/empresa/vacantes/1/candidaturas", { postulacion: String(p.id), estado, comentario }, tech), params: { id: "1" }, context: {} }));
    expect((await mover("contratada")).status).toBe(409); // en revisión → contratada no se permite
    expect((await mover("no_seleccionada")).status).toBe(400); // falta el mensaje
    expect((await mover("entrevista", "Te esperamos el lunes.")).status).toBe(302);
    const [aviso] = await q("select titulo from avisos where usuario_id = 1 order by id desc limit 1");
    expect(aviso.titulo).toBe("Tu postulación cambió");
  });

  it("no puede tocar candidaturas ni vacantes de otra empresa", async () => {
    const caribe = await entrarDemo(6);
    const [p] = await q("select id from postulaciones where persona_id = 1 and vacante_id = 1");
    const r = await correr(() => rutas.candidaturas.action!({ request: post("/empresa/vacantes/1/candidaturas", { postulacion: String(p.id), estado: "contratada" }, caribe), params: { id: "1" }, context: {} }));
    expect(r.status).toBe(404);
    const l = await correr(() => rutas.vacanteForm.loader!({ request: get("/empresa/vacantes/1", caribe), params: { id: "1" }, context: {} }));
    expect(l.status).toBe(404);
  });

  it("sin autorización de la persona, la empresa no ve sus ajustes", async () => {
    const hotel = await entrarDemo(7);
    const r = await correr(() => rutas.candidaturas.loader!({ request: get("/empresa/vacantes/7/candidaturas", hotel), params: { id: "7" }, context: {} }));
    const luz = r.datos.filas.find((f: any) => f.nombre === "Luz Marina Pérez");
    expect(luz.comparte).toBe(false);
    expect(luz.ajustes).toEqual([]);
    expect(luz.filas.some((f: any) => f.criterio === "ajuste")).toBe(false);
    expect(luz.filas[0].frase).not.toMatch(/sabes/i);
  });

  it("valida el salario mínimo legal en tiempo completo", async () => {
    const tech = await entrarDemo(5);
    const r = await correr(() =>
      rutas.vacanteForm.action!({
        request: post("/empresa/vacantes/nueva", { cargo: "Prueba", descripcion: "Tareas de prueba del puesto.", ciudad: "Cartagena", modalidad: "presencial", jornada: "completa", salario: "900000" }, tech),
        params: {}, context: {},
      }),
    );
    expect(r.status).toBe(400);
    expect(r.datos.errores.salario).toMatch(/mínimo legal/);
  });
});
