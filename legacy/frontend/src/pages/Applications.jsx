import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useRouteA11y } from '../hooks/useRouteA11y';
import { IconInbox, IconRobot, IconClock, IconCheck, IconAlert } from '../components/Icons';

const estadoStyle = {
  Postulado: 'bg-slate-100 text-slate-800 border-slate-300',
  'En revisión': 'bg-violet-50 text-violet-900 border-violet-300',
  Entrevista: 'bg-amber-50 text-amber-900 border-amber-300',
  Contratado: 'bg-teal-50 text-teal-900 border-teal-300',
  'No seleccionado': 'bg-rose-50 text-rose-900 border-rose-300',
  Retirada: 'bg-slate-100 text-slate-700 border-slate-300',
};

function formatoFecha(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Applications() {
  useRouteA11y('Mis Postulaciones');
  const [postulaciones, setPostulaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [retirando, setRetirando] = useState(null);

  const cargar = useCallback(() => {
    setLoading(true);
    apiFetch('/postulaciones')
      .then(data => setPostulaciones(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const retirar = async (post) => {
    if (!window.confirm(`¿Retirar tu postulación a “${post.cargo}”? Esta acción no se puede deshacer.`)) {
      return;
    }
    setError('');
    setMensaje('');
    setRetirando(post.id);
    try {
      await apiFetch(`/postulaciones/${post.id}`, { method: 'DELETE' });
      setMensaje('Tu postulación fue retirada.');
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setRetirando(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="page-header">
        <div>
          <span className="eyebrow">Seguimiento laboral</span>
          <h1 className="page-title mt-1" tabIndex={-1}>Mis postulaciones</h1>
          <p className="page-subtitle">Historial, estado y retroalimentación de los procesos en los que participas.</p>
        </div>
        {!loading && postulaciones.length > 0 && (
          <span className="badge-brand text-sm px-4 py-2">
            {postulaciones.length} proces{postulaciones.length !== 1 ? 'os' : 'o'}
          </span>
        )}
      </header>

      {mensaje && (
        <div role="status" className="alert-success">
          <IconCheck className="w-5 h-5 shrink-0" />
          <p>{mensaje}</p>
        </div>
      )}

      {error && (
        <div role="alert" className="alert-error">
          <IconAlert className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Error al cargar las postulaciones</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4" aria-busy="true">
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
        </div>
      ) : postulaciones.length === 0 ? (
        <div className="empty-state">
          <span className="text-slate-400" aria-hidden="true"><IconInbox className="w-10 h-10 mx-auto" /></span>
          <p className="text-lg font-semibold text-slate-800">Aún no te has postulado a ninguna vacante.</p>
          <p className="text-sm text-slate-500 max-w-md">
            Explora la sección de emparejamiento con IA para encontrar oportunidades compatibles con tus habilidades.
          </p>
          <Link to="/coincidencias" className="btn-primary mt-2">
            Ver vacantes compatibles
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {postulaciones.map((post) => (
            <article key={post.id} className="card p-6 md:p-7 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="eyebrow">{post.nombre_empresa} · {post.ciudad}</span>
                  <h2 className="text-2xl font-bold text-brand-900">{post.cargo}</h2>
                  <p className="text-sm text-slate-600">
                    Postulado el <strong>{formatoFecha(post.fecha)}</strong> &nbsp;|&nbsp;
                    Salario: <strong>${Number(post.salario).toLocaleString('es-CO')} COP</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`badge text-xs px-3 py-1 font-bold uppercase tracking-wider ${estadoStyle[post.estado] || estadoStyle.Postulado}`}>
                    {post.estado}
                  </span>
                  <div className="score-pill bg-slate-100 border-slate-300 text-slate-900 !min-w-[80px]">
                    <span className="text-xl font-extrabold">{post.score}%</span>
                    <span className="text-[10px] font-bold uppercase">Compatibilidad</span>
                  </div>
                </div>
              </div>

              {post.explicacion && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm text-slate-700 flex items-start gap-3">
                  <span className="text-teal-700 shrink-0" aria-hidden="true"><IconRobot className="w-5 h-5" /></span>
                  <div>
                    <span className="font-bold text-brand-900 block text-xs uppercase tracking-wider mb-0.5">
                      Compatibilidad {post.explicacion.nivel}
                    </span>
                    <span>{post.explicacion.razones?.[0] || 'Postulación registrada.'}</span>
                  </div>
                </div>
              )}

              {post.feedback && (
                <div className="alert alert-success items-start">
                  <IconCheck className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-bold">Retroalimentación de la empresa</p>
                    <p>{post.feedback}</p>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-[1fr_auto] gap-4 pt-3 border-t border-slate-200">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2">
                    <IconClock className="w-4 h-4" /> Línea de tiempo
                  </h3>
                  {post.historial?.length ? (
                    <ol className="space-y-2">
                      {post.historial.map((evento, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 shrink-0" aria-hidden="true" />
                          <span>
                            <strong>{evento.estado_nuevo}</strong>
                            {evento.comentario ? ` · ${evento.comentario}` : ''}
                            <span className="block text-xs text-slate-500">{formatoFecha(evento.creado_en)}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-slate-500">Sin cambios de estado todavía.</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 md:items-end">
                  <Link to={`/vacantes/${post.vacante_id}`} className="btn-secondary btn-sm">
                    Ver vacante
                  </Link>
                  {post.puede_retirar && (
                    <button
                      type="button"
                      onClick={() => retirar(post)}
                      disabled={retirando === post.id}
                      className="btn-secondary btn-sm text-rose-700 hover:bg-rose-50 hover:ring-rose-200"
                    >
                      {retirando === post.id ? 'Retirando…' : 'Retirar postulación'}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
