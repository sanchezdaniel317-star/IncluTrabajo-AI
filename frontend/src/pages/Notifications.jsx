import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useRouteA11y } from '../hooks/useRouteA11y';
import { IconBell, IconCheck, IconAlert, IconArrowRight } from '../components/Icons';

function formatoFecha(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function Notifications() {
  useRouteA11y('Notificaciones');
  const [items, setItems] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = useCallback(() => {
    setLoading(true);
    apiFetch('/notificaciones')
      .then(data => {
        setItems(data.items || []);
        setNoLeidas(data.no_leidas || 0);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const marcar = async (notificacion, leer = true) => {
    if (leer) {
      try {
        await apiFetch(`/notificaciones/${notificacion.id}/leida`, { method: 'PATCH' });
        setItems(prev => prev.map(n => n.id === notificacion.id ? { ...n, leida: 1 } : n));
        setNoLeidas(prev => Math.max(0, prev - 1));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const marcarTodas = async () => {
    setMensaje('');
    try {
      await apiFetch('/notificaciones/leer-todas', { method: 'PATCH' });
      setItems(prev => prev.map(n => ({ ...n, leida: 1 })));
      setNoLeidas(0);
      setMensaje('Todas las notificaciones fueron marcadas como leídas.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="page-header">
        <div>
          <span className="eyebrow">Actividad</span>
          <h1 className="page-title mt-1" tabIndex={-1}>Notificaciones</h1>
          <p className="page-subtitle">Novedades de tus postulaciones y de las candidaturas que recibes.</p>
        </div>
        {noLeidas > 0 && (
          <button type="button" onClick={marcarTodas} className="btn-secondary">
            <IconCheck className="w-4 h-4" /> Marcar todas como leídas
          </button>
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
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-3" aria-busy="true">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <IconBell className="w-10 h-10 mx-auto text-slate-400" />
          <p className="text-lg font-semibold text-slate-800">No tienes notificaciones todavía.</p>
          <p className="text-sm text-slate-500">Cuando cambie el estado de una postulación aparecerá aquí.</p>
          <Link to="/inicio" className="btn-secondary mt-2">Volver al inicio</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map(n => (
            <li
              key={n.id}
              className={`card p-5 space-y-2 ${n.leida ? '' : 'ring-violet-300 bg-violet-50/40'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${n.leida ? 'bg-slate-300' : 'bg-violet-600'}`} aria-hidden="true" />
                  <div>
                    <p className="font-bold text-slate-900">{n.titulo}</p>
                    <p className="text-sm text-slate-600">{n.mensaje}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatoFecha(n.creada_en)}</p>
                  </div>
                </div>
                {!n.leida && (
                  <span className="badge-brand text-[11px]">Nueva</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pl-5">
                {n.url && (
                  <Link
                    to={n.url}
                    onClick={() => marcar(n)}
                    className="btn-secondary btn-sm"
                  >
                    Ver detalle <IconArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                {!n.leida && (
                  <button type="button" onClick={() => marcar(n)} className="btn-secondary btn-sm">
                    Marcar como leída
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
