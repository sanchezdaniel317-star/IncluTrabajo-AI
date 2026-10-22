import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useRouteA11y } from '../hooks/useRouteA11y';
import {
  IconBriefcase, IconAccessibility, IconArrowRight, IconPlus,
  IconEdit, IconUsers, IconCheck, IconAlert
} from '../components/Icons';

export default function CompanyDashboard() {
  useRouteA11y('Panel Empresa');
  const [vacantes, setVacantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cambiando, setCambiando] = useState(null);

  const cargar = useCallback(() => {
    setLoading(true);
    apiFetch('/empresa/vacantes')
      .then(data => setVacantes(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarEstado = async (vac) => {
    const accion = vac.activa ? 'cerrar' : 'reabrir';
    if (!window.confirm(`¿${accion === 'cerrar' ? 'Cerrar' : 'Reabrir'} la vacante “${vac.cargo}”?`)) {
      return;
    }
    setError('');
    setMensaje('');
    setCambiando(vac.id);
    try {
      await apiFetch(`/empresa/vacantes/${vac.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ activa: !vac.activa }),
      });
      setMensaje(`Vacante ${vac.activa ? 'cerrada' : 'reabierta'} correctamente.`);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCambiando(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="page-header">
        <div>
          <span className="eyebrow">Gestión B2B</span>
          <h1 className="page-title mt-1" tabIndex={-1}>Panel de empresa</h1>
          <p className="page-subtitle">Gestiona tus publicaciones, revisa postulantes y actualiza cada proceso.</p>
        </div>
        <Link to="/empresa/vacantes/nueva" className="btn-primary">
          <IconPlus className="w-4 h-4" /> Publicar nueva vacante
        </Link>
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
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4" aria-busy="true">
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
        </div>
      ) : vacantes.length === 0 ? (
        <div className="empty-state">
          <span className="text-slate-400" aria-hidden="true"><IconBriefcase className="w-10 h-10 mx-auto" /></span>
          <p className="text-lg font-semibold text-slate-800">Aún no has publicado ninguna vacante.</p>
          <p className="text-sm text-slate-500 max-w-md">
            Crea tu primera oferta laboral definiendo competencias y checklist de accesibilidad.
          </p>
          <Link to="/empresa/vacantes/nueva" className="btn-primary mt-2">
            Publicar vacante inclusiva
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {vacantes.map((vac) => (
            <article key={vac.id} className="card p-6 md:p-7 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="eyebrow">
                    {vac.ciudad} · Modalidad <strong className="capitalize text-slate-800">{vac.modalidad}</strong>
                  </span>
                  <h2 className="text-2xl font-bold text-brand-900">{vac.cargo}</h2>
                  <p className="text-sm text-slate-600">
                    Salario: <strong>${Number(vac.salario).toLocaleString('es-CO')} COP</strong> &nbsp;|&nbsp; Estado:{' '}
                    <span className={`inline-flex items-center gap-1 font-bold ${vac.activa ? 'text-teal-800' : 'text-rose-700'}`}>
                      ● {vac.activa ? 'Activa' : 'Cerrada'}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge-neutral text-sm">
                    <IconUsers className="w-4 h-4" /> {vac.postulantes || 0} postulante{vac.postulantes === 1 ? '' : 's'}
                  </span>
                  <Link to={`/empresa/vacantes/${vac.id}/editar`} className="btn-secondary btn-sm">
                    <IconEdit className="w-4 h-4" /> Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => cambiarEstado(vac)}
                    disabled={cambiando === vac.id}
                    className="btn-secondary btn-sm"
                  >
                    {cambiando === vac.id ? 'Guardando…' : (vac.activa ? 'Cerrar' : 'Reabrir')}
                  </button>
                  <Link to={`/empresa/vacantes/${vac.id}/candidatos`} className="btn-navy btn-sm">
                    Ver candidatos <IconArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
                {vac.accesibilidad?.map((acc, idx) => (
                  <span key={idx} className={acc.verificada ? 'badge-access' : 'badge-neutral'}>
                    <IconAccessibility className="w-3.5 h-3.5" /> {acc.nombre}
                    {acc.verificada ? ' · verificada' : ' · declarada'}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
