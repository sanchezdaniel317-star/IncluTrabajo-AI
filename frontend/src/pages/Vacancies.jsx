import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useSession } from '../contexts/SessionContext';
import { useRouteA11y } from '../hooks/useRouteA11y';
import {
  IconSearch, IconMapPin, IconBriefcase, IconClock, IconWallet,
  IconAccessibility, IconArrowRight, IconBadgeCheck, IconAlert, IconX
} from '../components/Icons';

const filtrosIniciales = {
  q: '',
  ciudad: '',
  modalidad: '',
  jornada: '',
  accesibilidad: '',
};

export default function Vacancies() {
  useRouteA11y('Vacantes');
  const { session } = useSession();
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [aplicados, setAplicados] = useState(filtrosIniciales);
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState({ items: [], total: 0, pages: 1 });
  const [catalogos, setCatalogos] = useState({ necesidades: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/catalogos')
      .then(data => setCatalogos(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let activo = true;
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    Object.entries(aplicados).forEach(([clave, valor]) => {
      if (valor) params.set(clave, valor);
    });
    params.set('page', String(pagina));
    params.set('per_page', '9');
    apiFetch(`/vacantes?${params.toString()}`)
      .then(data => {
        if (activo) setDatos(data);
      })
      .catch(err => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => { activo = false; };
  }, [aplicados, pagina]);

  const set = (campo, valor) => setFiltros(prev => ({ ...prev, [campo]: valor }));

  const aplicar = (e) => {
    e.preventDefault();
    setPagina(1);
    setAplicados({ ...filtros });
  };

  const limpiar = () => {
    setFiltros(filtrosIniciales);
    setAplicados(filtrosIniciales);
    setPagina(1);
  };

  const hayFiltros = Object.values(aplicados).some(Boolean);

  return (
    <div className="space-y-8">
      <header className="page-header">
        <div>
          <span className="eyebrow">Catálogo inclusivo</span>
          <h1 className="page-title mt-1" tabIndex={-1}>Todas las vacantes</h1>
          <p className="page-subtitle">
            Explora oportunidades activas y revisa qué condiciones de accesibilidad declara cada empresa.
          </p>
        </div>
        {!loading && (
          <span className="badge-brand text-sm px-4 py-2">
            {datos.total} vacante{datos.total !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      <form onSubmit={aplicar} className="card p-5 md:p-6 space-y-4" aria-label="Filtros de vacantes">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label htmlFor="q" className="field-label">Buscar</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">
                <IconSearch className="w-4 h-4" />
              </span>
              <input
                id="q"
                type="search"
                value={filtros.q}
                onChange={e => set('q', e.target.value)}
                className="field-input pl-10"
                placeholder="Cargo o palabra clave"
              />
            </div>
          </div>
          <div>
            <label htmlFor="ciudad" className="field-label">Ciudad</label>
            <input
              id="ciudad"
              type="text"
              value={filtros.ciudad}
              onChange={e => set('ciudad', e.target.value)}
              className="field-input"
              placeholder="Ej. Cartagena"
            />
          </div>
          <div>
            <label htmlFor="modalidad" className="field-label">Modalidad</label>
            <select
              id="modalidad"
              value={filtros.modalidad}
              onChange={e => set('modalidad', e.target.value)}
              className="field-input cursor-pointer"
            >
              <option value="">Todas</option>
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
              <option value="remoto">Remoto</option>
            </select>
          </div>
          <div>
            <label htmlFor="jornada" className="field-label">Jornada</label>
            <select
              id="jornada"
              value={filtros.jornada}
              onChange={e => set('jornada', e.target.value)}
              className="field-input cursor-pointer"
            >
              <option value="">Todas</option>
              <option value="completa">Tiempo completo</option>
              <option value="medio_tiempo">Medio tiempo</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="accesibilidad" className="field-label">Ajuste de accesibilidad</label>
            <select
              id="accesibilidad"
              value={filtros.accesibilidad}
              onChange={e => set('accesibilidad', e.target.value)}
              className="field-input cursor-pointer"
            >
              <option value="">Cualquier ajuste</option>
              {catalogos.necesidades.map(n => (
                <option key={n.id} value={n.nombre}>{n.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 lg:col-span-3">
            <button type="submit" className="btn-primary">
              <IconSearch className="w-4 h-4" /> Buscar
            </button>
            {hayFiltros && (
              <button type="button" onClick={limpiar} className="btn-secondary">
                <IconX className="w-4 h-4" /> Limpiar
              </button>
            )}
          </div>
        </div>
      </form>

      {error && (
        <div role="alert" className="alert-error">
          <IconAlert className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
          {[0, 1, 2].map(i => <div key={i} className="skeleton h-64" />)}
        </div>
      ) : datos.items.length === 0 ? (
        <div className="empty-state">
          <IconSearch className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-lg font-semibold text-slate-800">No encontramos vacantes con esos filtros.</p>
          <p className="text-sm text-slate-500">Prueba con otra ciudad, modalidad o palabra clave.</p>
          <button type="button" onClick={limpiar} className="btn-secondary mt-2">Limpiar filtros</button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {datos.items.map(vac => (
              <article key={vac.id} className="card-interactive p-6 flex flex-col gap-4">
                <div className="space-y-1">
                  <span className="eyebrow">{vac.empresa?.nombre_empresa || 'Empresa aliada'}</span>
                  <h2 className="text-lg font-bold text-slate-900 leading-snug">{vac.cargo}</h2>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="badge-neutral"><IconMapPin className="w-3.5 h-3.5" /> {vac.ciudad}</span>
                  <span className="badge-neutral capitalize"><IconBriefcase className="w-3.5 h-3.5" /> {vac.modalidad}</span>
                  <span className="badge-neutral capitalize"><IconClock className="w-3.5 h-3.5" /> {vac.jornada}</span>
                </div>
                <p className="text-base font-extrabold text-slate-900">
                  ${Number(vac.salario).toLocaleString('es-CO')} <span className="text-xs font-semibold text-slate-500">COP</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {vac.accesibilidad?.slice(0, 3).map((acc, idx) => (
                    <span key={idx} className={acc.verificada ? 'badge-access' : 'badge-neutral'}>
                      <IconAccessibility className="w-3.5 h-3.5" /> {acc.nombre}
                      {acc.verificada && <IconBadgeCheck className="w-3 h-3" aria-hidden="true" />}
                    </span>
                  ))}
                  {(vac.accesibilidad?.length || 0) > 3 && (
                    <span className="badge-neutral">+{vac.accesibilidad.length - 3}</span>
                  )}
                </div>
                <Link to={`/vacantes/${vac.id}`} className="mt-auto btn-navy w-full">
                  Ver detalle
                  <IconArrowRight className="w-4 h-4" />
                </Link>
              </article>
            ))}
          </div>

          {datos.pages > 1 && (
            <nav className="flex items-center justify-center gap-2" aria-label="Paginación de vacantes">
              <button
                type="button"
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina <= 1}
                className="btn-secondary btn-sm"
              >
                Anterior
              </button>
              <span className="text-sm font-semibold text-slate-700" aria-live="polite">
                Página {datos.page} de {datos.pages}
              </span>
              <button
                type="button"
                onClick={() => setPagina(p => Math.min(datos.pages, p + 1))}
                disabled={pagina >= datos.pages}
                className="btn-secondary btn-sm"
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}

      {!session.perfil && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white ring-1 ring-slate-900/10 shadow-sm p-5">
          <p className="text-sm text-slate-700">
            ¿Quieres postularte? Crea una cuenta gratuita o inicia sesión para ver tu compatibilidad.
          </p>
          <div className="flex gap-2">
            <Link to="/registro" className="btn-primary btn-sm">Crear cuenta</Link>
            <Link to="/login" className="btn-secondary btn-sm">Iniciar sesión</Link>
          </div>
        </div>
      )}
    </div>
  );
}
