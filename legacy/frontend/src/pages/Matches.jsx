import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useRouteA11y } from '../hooks/useRouteA11y';
import {
  IconBriefcase, IconClock, IconWallet, IconAccessibility,
  IconCheck, IconAlert, IconArrowRight, IconSearch
} from '../components/Icons';

const nivelStyle = {
  Alta: { box: 'bg-teal-50 border-teal-300 text-teal-900', bar: 'from-teal-400 to-teal-600', label: 'Alta' },
  Media: { box: 'bg-amber-50 border-amber-300 text-amber-900', bar: 'from-amber-400 to-amber-600', label: 'Media' },
  Baja: { box: 'bg-slate-50 border-slate-300 text-slate-800', bar: 'from-slate-400 to-slate-500', label: 'Baja' },
  'No compatible': { box: 'bg-rose-50 border-rose-300 text-rose-900', bar: 'from-rose-400 to-rose-600', label: 'No compatible' },
};

function CargandoTarjetas() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Calculando coincidencias">
      {[0, 1].map(i => <div key={i} className="skeleton h-64" />)}
    </div>
  );
}

export default function Matches() {
  useRouteA11y('Emparejamiento IA');
  const [coincidencias, setCoincidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/candidato/coincidencias')
      .then(data => setCoincidencias(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <header className="page-header">
        <div>
          <span className="eyebrow">Emparejamiento explicable</span>
          <h1 className="page-title mt-1" tabIndex={-1}>Vacantes compatibles contigo</h1>
          <p className="page-subtitle">
            Cada resultado muestra por qué encaja con tu perfil y qué aspectos aún faltan, para que tomes decisiones informadas.
          </p>
        </div>
        {!loading && coincidencias.length > 0 && (
          <span className="badge-brand text-sm px-4 py-2">{coincidencias.length} vacante{coincidencias.length !== 1 ? 's' : ''}</span>
        )}
      </header>

      {error && (
        <div role="alert" className="alert-error">
          <div>
            <p className="font-bold">No pudimos cargar las coincidencias</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <CargandoTarjetas />
      ) : coincidencias.length === 0 ? (
        <div className="empty-state">
          <span className="text-4xl text-slate-400" aria-hidden="true"><IconSearch className="w-10 h-10 mx-auto" /></span>
          <p className="text-lg font-semibold text-slate-800">No hay vacantes activas en este momento.</p>
          <p className="text-sm text-slate-500">Vuelve más tarde o actualiza tus competencias en tu perfil.</p>
          <Link to="/perfil" className="btn-secondary mt-2">Actualizar mi perfil</Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {coincidencias.map(({ vacante, match, ya_postulado }) => {
            const estilo = nivelStyle[match.nivel] || nivelStyle.Baja;
            return (
              <article key={vacante.id} className="card-interactive p-0 overflow-hidden">
                <div className="grid md:grid-cols-[1fr_auto] gap-6 p-6 md:p-7">
                  <div className="space-y-3 min-w-0">
                    <span className="eyebrow">
                      {vacante.empresa?.nombre_empresa || 'Empresa aliada'} · {vacante.ciudad}
                    </span>
                    <h2 className="text-2xl font-bold text-brand-900">{vacante.cargo}</h2>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="badge-neutral capitalize"><IconBriefcase className="w-3.5 h-3.5" /> {vacante.modalidad}</span>
                      <span className="badge-neutral capitalize"><IconClock className="w-3.5 h-3.5" /> {vacante.jornada}</span>
                      <span className="badge-neutral"><IconWallet className="w-3.5 h-3.5" /> ${Number(vacante.salario).toLocaleString()} COP</span>
                    </div>
                  </div>

                  <div className={`score-pill self-start ${estilo.box}`}>
                    <span className="text-3xl font-extrabold leading-none">{match.score}%</span>
                    <span className="text-[11px] font-bold uppercase tracking-wide mt-1">
                      {estilo.label === 'No compatible' ? 'No compatible' : `Compatibilidad ${estilo.label}`}
                    </span>
                    <div className="w-full h-1.5 rounded-full bg-black/10 mt-2 overflow-hidden" aria-hidden="true">
                      <div className={`h-full rounded-full bg-gradient-to-r ${estilo.bar}`} style={{ width: `${match.score}%` }} />
                    </div>
                  </div>
                </div>

                {/* Desglose explicable */}
                {match.detalle?.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-5 border-t border-slate-200 bg-slate-50/60">
                    {match.detalle.map(item => {
                      const color = item.estado === 'ok'
                        ? 'bg-teal-500'
                        : item.estado === 'parcial'
                          ? 'bg-amber-500'
                          : item.estado === 'sin_datos'
                            ? 'bg-slate-400'
                            : 'bg-rose-500';
                      return (
                        <div key={item.criterio} className="space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                              {item.etiqueta}
                            </span>
                            <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                              {item.obtenido}/{item.maximo}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden" aria-hidden="true">
                            <div
                              className={`h-full rounded-full ${color}`}
                              style={{ width: `${Math.round((item.obtenido / item.maximo) * 100)}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">{item.detalle}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explicación */}
                <div className="grid md:grid-cols-2 gap-px bg-slate-200 border-t border-slate-200">
                  <div className="bg-white p-6 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                      <IconCheck className="w-4 h-4" /> Coincidencias
                    </h3>
                    {match.razones.length > 0 ? (
                      <ul className="space-y-2 text-sm text-slate-700">
                        {match.razones.map((razon, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center" aria-hidden="true"><IconCheck className="w-3 h-3" /></span>
                            <span>{razon}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">Aún no hay coincidencias destacadas.</p>
                    )}
                  </div>

                  <div className="bg-white p-6 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <IconAlert className="w-4 h-4" /> Por mejorar o confirmar
                    </h3>
                    {match.faltantes.length > 0 ? (
                      <ul className="space-y-2 text-sm text-slate-600">
                        {match.faltantes.map((fal, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center" aria-hidden="true"><IconAlert className="w-3 h-3" /></span>
                            <span>{fal}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No encontramos brechas importantes.</p>
                    )}
                  </div>
                </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-50/70 border-t border-slate-200">
                    <div className="flex flex-wrap items-center gap-2" aria-label="Ajustes de accesibilidad del puesto">
                      {vacante.accesibilidad?.map((acc, idx) => (
                        <span key={idx} className={acc.verificada ? 'badge-access' : 'badge-neutral'}>
                          <IconAccessibility className="w-3.5 h-3.5" /> {acc.nombre}
                          {acc.verificada && <span className="sr-only"> (verificada)</span>}
                        </span>
                      ))}
                    </div>

                    {ya_postulado ? (
                      <Link to="/postulaciones" className="btn-navy">
                        <IconCheck className="w-4 h-4" /> Ya postulado
                      </Link>
                    ) : (
                      <Link to={`/vacantes/${vacante.id}`} className="btn-navy">
                        Ver detalle y postularme
                        <IconArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
