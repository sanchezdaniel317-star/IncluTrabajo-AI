import { Form, Link, useSearchParams, useSubmit } from "react-router";
import type { Route } from "./+types/vacantes";
import { cargarPersona, cargarVacantes, catalogos, ciudadesConVacantes } from "~/.server/datos";
import { usuarioActual } from "~/.server/sesion";
import { cop, JORNADAS, MODALIDADES } from "~/lib/catalogo";
import { emparejar } from "~/lib/matching";
import { Icono } from "~/components/Icono";
import { Anillo, EstadoAjusteChip, Vacio } from "~/components/ui";

export const meta: Route.MetaFunction = () => [{ title: "Vacantes — IncluTrabajo IA" }];

const POR_PAGINA = 8;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const filtros = {
    texto: url.searchParams.get("q")?.trim().slice(0, 80) || undefined,
    ciudad: url.searchParams.get("ciudad") || undefined,
    modalidad: url.searchParams.get("modalidad") || undefined,
    ajusteClave: url.searchParams.get("ajuste") || undefined,
    soloVerificadas: url.searchParams.get("verificadas") === "si",
  };
  const pagina = Math.max(1, Number(url.searchParams.get("pagina")) || 1);
  const [usuario, todas, { ajustes }, ciudades] = await Promise.all([
    usuarioActual(request),
    cargarVacantes(filtros),
    catalogos(),
    ciudadesConVacantes(),
  ]);
  const persona = usuario?.rol === "persona" ? await cargarPersona(usuario.id) : null;
  const total = todas.length;
  const vacantes = todas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA).map((v) => ({
    ...v,
    match: persona ? emparejar(persona, v) : null,
  }));
  return { vacantes, total, pagina, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)), ajustes, ciudades, conPuntaje: Boolean(persona) };
}

export default function Vacantes({ loaderData }: Route.ComponentProps) {
  const { vacantes, total, pagina, paginas, ajustes, ciudades, conPuntaje } = loaderData;
  const [params] = useSearchParams();
  const submit = useSubmit();
  const enlacePagina = (n: number) => {
    const p = new URLSearchParams(params);
    p.set("pagina", String(n));
    return `?${p.toString()}`;
  };
  return (
    <div className="contenedor py-8 md:py-12 grid gap-8">
      <div className="grid gap-2">
        <h1 className="titulo-pagina">Vacantes</h1>
        <p className="subtitulo" aria-live="polite">
          {total === 1 ? "1 vacante" : `${total} vacantes`} con su accesibilidad declarada o verificada.{conPuntaje ? " Tu puntaje aparece en cada una." : ""}
        </p>
      </div>

      <Form method="get" className="tarjeta grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto] md:items-end" role="search" aria-label="Filtrar vacantes"
        onChange={(e) => submit(e.currentTarget, { preventScrollReset: true, replace: true })}>
        <div className="campo">
          <label htmlFor="q" className="etiqueta">Cargo o palabra</label>
          <input id="q" name="q" type="search" className="entrada" defaultValue={params.get("q") ?? ""} placeholder="Por ejemplo: cocina" />
        </div>
        <div className="campo">
          <label htmlFor="ciudad" className="etiqueta">Ciudad</label>
          <select id="ciudad" name="ciudad" className="entrada" defaultValue={params.get("ciudad") ?? ""}>
            <option value="">Todas</option>
            {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="modalidad" className="etiqueta">Modalidad</label>
          <select id="modalidad" name="modalidad" className="entrada" defaultValue={params.get("modalidad") ?? ""}>
            <option value="">Todas</option>
            {Object.entries(MODALIDADES).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="ajuste" className="etiqueta">Con este ajuste</label>
          <select id="ajuste" name="ajuste" className="entrada" defaultValue={params.get("ajuste") ?? ""}>
            <option value="">Cualquiera</option>
            {ajustes.map((a) => <option key={a.clave} value={a.clave}>{a.nombre}</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-claro">Buscar</button>
        <label className="flex items-center gap-3 md:col-span-5 font-semibold cursor-pointer w-fit">
          <input type="checkbox" name="verificadas" value="si" defaultChecked={params.get("verificadas") === "si"} />
          Solo con ajustes verificados en el puesto
        </label>
      </Form>

      {vacantes.length === 0 ? (
        <Vacio titulo="No hay vacantes con esos filtros" accion={<Link to="/vacantes" className="btn btn-claro">Quitar filtros</Link>}>
          Prueba con otra ciudad o quita el filtro de ajuste.
        </Vacio>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2" role="list">
          {vacantes.map((v) => (
            <li key={v.id}>
              <Link to={`/vacantes/${v.id}`} className="tarjeta tarjeta-tocable grid gap-4 h-full">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 grow">
                    <h2 className="text-2xl">{v.cargo}</h2>
                    <p className="text-tinta-2 mt-1">{v.empresa}</p>
                  </div>
                  {v.match && <Anillo puntaje={v.match.puntaje} tamano={72} etiqueta={`${v.match.puntaje} de 100, ${v.match.etiqueta}`} />}
                </div>
                <p className="flex flex-wrap gap-x-5 gap-y-1 font-semibold">
                  <span className="inline-flex items-center gap-1.5"><Icono nombre="ubicacion" className="size-5" />{v.ciudad} · {MODALIDADES[v.modalidad]}</span>
                  <span className="inline-flex items-center gap-1.5"><Icono nombre="reloj" className="size-5" />{JORNADAS[v.jornada]}</span>
                  <span className="inline-flex items-center gap-1.5 num"><Icono nombre="dinero" className="size-5" />{cop(v.salario)}</span>
                </p>
                {v.match && <p className="font-black">{v.match.etiqueta}</p>}
                <ul className="flex flex-wrap gap-2" role="list" aria-label="Accesibilidad del puesto">
                  {v.ajustes.slice(0, 4).map((a) => (
                    <li key={a.id} className="flex items-center gap-2">
                      <EstadoAjusteChip estado={a.estado} />
                      <span className="font-semibold">{a.nombre}</span>
                    </li>
                  ))}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {paginas > 1 && (
        <nav aria-label="Páginas" className="flex flex-wrap items-center gap-2">
          {Array.from({ length: paginas }, (_, i) => i + 1).map((n) => (
            <Link key={n} to={enlacePagina(n)} className={`btn ${n === pagina ? "btn-accion" : "btn-claro"} btn-icono num`} aria-current={n === pagina ? "page" : undefined} aria-label={`Página ${n}`}>{n}</Link>
          ))}
        </nav>
      )}
    </div>
  );
}
