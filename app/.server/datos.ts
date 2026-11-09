import { q, q1 } from "./db";
import type { EstadoAjuste, JornadaPref, ModalidadPref, Prioridad } from "~/lib/catalogo";
import { calcularIap, type CriterioIap } from "~/lib/iap";
import type { PersonaParaMatch, VacanteParaMatch } from "~/lib/matching";

export interface Competencia { id: number; nombre: string; sinonimos: string[] }
export interface Ajuste { id: number; clave: string; nombre: string; descripcion: string; dominio: string; criterio: string }

export async function catalogos() {
  const [competencias, ajustes] = await Promise.all([
    q<Competencia>("select id, nombre, sinonimos from competencias order by nombre"),
    q<Ajuste>("select id, clave, nombre, descripcion, dominio, criterio from ajustes order by id"),
  ]);
  return { competencias, ajustes };
}

export interface PersonaCompleta extends PersonaParaMatch {
  usuario_id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  experiencia_anios: number;
  comparte_ajustes: boolean;
  dominios: Record<string, number>;
  ajustes: { id: number; clave: string; nombre: string; prioridad: Prioridad }[];
}

export async function cargarPersona(uid: number): Promise<PersonaCompleta | null> {
  const p = await q1<any>(
    `select p.*, u.nombre, u.email from personas p join usuarios u on u.id = p.usuario_id where p.usuario_id = $1`,
    [uid],
  );
  if (!p) return null;
  const [competencias, ajustes] = await Promise.all([
    q<{ id: number; nombre: string }>(
      "select c.id, c.nombre from persona_competencias pc join competencias c on c.id = pc.competencia_id where pc.persona_id = $1 order by c.nombre",
      [uid],
    ),
    q<{ id: number; clave: string; nombre: string; prioridad: number }>(
      "select a.id, a.clave, a.nombre, pa.prioridad from persona_ajustes pa join ajustes a on a.id = pa.ajuste_id where pa.persona_id = $1 order by pa.prioridad desc, a.nombre",
      [uid],
    ),
  ]);
  return {
    usuario_id: p.usuario_id,
    nombre: p.nombre,
    email: p.email,
    ciudad: p.ciudad,
    telefono: p.telefono,
    experiencia_anios: p.experiencia_anios,
    modalidad_pref: p.modalidad_pref as ModalidadPref,
    jornada_pref: p.jornada_pref as JornadaPref,
    salario_min: Number(p.salario_min),
    comparte_ajustes: p.comparte_ajustes,
    dominios: (typeof p.dominios === "string" ? JSON.parse(p.dominios) : p.dominios) ?? {},
    competencias,
    ajustes: ajustes.map((a) => ({ ...a, prioridad: a.prioridad as Prioridad })),
  };
}

export interface VacanteCompleta extends VacanteParaMatch {
  id: number;
  empresa_id: number;
  empresa: string;
  sector: string;
  cargo: string;
  descripcion: string;
  activa: boolean;
  creada_en: string;
  requisitos: { id: number; nombre: string }[];
  ajustes: (VacanteParaMatch["ajustes"][number] & { clave: string; descripcion: string })[];
  iapValores: Partial<Record<CriterioIap, number>>;
  iap: ReturnType<typeof calcularIap>;
}

export interface FiltrosVacantes {
  soloActivas?: boolean;
  empresaId?: number;
  ids?: number[];
  texto?: string;
  ciudad?: string;
  modalidad?: string;
  ajusteClave?: string;
  soloVerificadas?: boolean;
}

export async function cargarVacantes(f: FiltrosVacantes = {}): Promise<VacanteCompleta[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  if (f.soloActivas !== false) where.push("v.activa = true");
  if (f.empresaId) where.push(`v.empresa_id = ${p(f.empresaId)}`);
  if (f.ids) where.push(`v.id = any(${p(f.ids)}::int[])`);
  if (f.texto) where.push(`(v.cargo ilike ${p("%" + f.texto + "%")} or v.descripcion ilike $${params.length})`);
  if (f.ciudad) where.push(`v.ciudad = ${p(f.ciudad)}`);
  if (f.modalidad) where.push(`v.modalidad = ${p(f.modalidad)}`);
  if (f.ajusteClave) {
    where.push(
      `exists (select 1 from vacante_ajustes va join ajustes a on a.id = va.ajuste_id where va.vacante_id = v.id and a.clave = ${p(f.ajusteClave)}${f.soloVerificadas ? " and va.estado = 'verificado'" : ""})`,
    );
  } else if (f.soloVerificadas) {
    where.push("exists (select 1 from vacante_ajustes va where va.vacante_id = v.id and va.estado = 'verificado')");
  }
  const filas = await q<any>(
    `select v.*, u.nombre as empresa, e.sector
       from vacantes v join empresas e on e.usuario_id = v.empresa_id join usuarios u on u.id = e.usuario_id
      ${where.length ? "where " + where.join(" and ") : ""}
      order by v.creada_en desc, v.id desc`,
    params,
  );
  if (filas.length === 0) return [];
  const ids = filas.map((v) => v.id);
  const [req, aj, iap] = await Promise.all([
    q<any>(
      "select vc.vacante_id, c.id, c.nombre from vacante_competencias vc join competencias c on c.id = vc.competencia_id where vc.vacante_id = any($1::int[]) order by c.nombre",
      [ids],
    ),
    q<any>(
      `select va.vacante_id, a.id, a.clave, a.nombre, a.descripcion, va.estado, va.evidencia,
              to_char(va.verificado_en, 'YYYY-MM-DD') as verificado_en, to_char(va.compromiso_en, 'YYYY-MM-DD') as compromiso_en
         from vacante_ajustes va join ajustes a on a.id = va.ajuste_id
        where va.vacante_id = any($1::int[])
        order by case va.estado when 'verificado' then 0 when 'ajustable' then 1 else 2 end, a.nombre`,
      [ids],
    ),
    q<any>("select vacante_id, criterio, valor::float as valor from vacante_iap where vacante_id = any($1::int[])", [ids]),
  ]);
  return filas.map((v) => {
    const iapValores: Partial<Record<CriterioIap, number>> = {};
    for (const r of iap) if (r.vacante_id === v.id) iapValores[r.criterio as CriterioIap] = Number(r.valor);
    return {
      id: v.id,
      empresa_id: v.empresa_id,
      empresa: v.empresa,
      sector: v.sector,
      cargo: v.cargo,
      descripcion: v.descripcion,
      ciudad: v.ciudad,
      modalidad: v.modalidad,
      jornada: v.jornada,
      salario: Number(v.salario),
      activa: v.activa,
      creada_en: String(v.creada_en),
      requisitos: req.filter((r) => r.vacante_id === v.id).map((r) => ({ id: r.id, nombre: r.nombre })),
      ajustes: aj
        .filter((r) => r.vacante_id === v.id)
        .map((r) => ({
          id: r.id,
          clave: r.clave,
          nombre: r.nombre,
          descripcion: r.descripcion,
          estado: r.estado as EstadoAjuste,
          evidencia: r.evidencia,
          verificado_en: r.verificado_en,
          compromiso_en: r.compromiso_en,
        })),
      iapValores,
      iap: calcularIap(iapValores),
    };
  });
}

export async function cargarVacante(id: number): Promise<VacanteCompleta | null> {
  return (await cargarVacantes({ ids: [id], soloActivas: false }))[0] ?? null;
}

export async function ciudadesConVacantes(): Promise<string[]> {
  return (await q<{ ciudad: string }>("select distinct ciudad from vacantes where activa order by ciudad")).map((r) => r.ciudad);
}

export async function contarAvisos(uid: number): Promise<number> {
  const r = await q1<{ n: number }>("select count(*)::int as n from avisos where usuario_id = $1 and not leido", [uid]);
  return r?.n ?? 0;
}

export async function avisar(
  qq: { query: (s: string, p?: unknown[]) => Promise<unknown[]> },
  usuarioId: number,
  titulo: string,
  mensaje: string,
  url?: string,
) {
  await qq.query("insert into avisos (usuario_id, titulo, mensaje, url) values ($1, $2, $3, $4)", [usuarioId, titulo, mensaje, url ?? null]);
}
