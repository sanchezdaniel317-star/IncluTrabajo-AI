import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useRouteA11y } from '../hooks/useRouteA11y';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useSession } from '../contexts/SessionContext';
import {
  IconMapPin, IconBriefcase, IconClock, IconAccessibility,
  IconSpeaker, IconArrowLeft, IconCheck, IconAlert, IconClipboard,
  IconBadgeCheck
} from '../components/Icons';

export default function VacancyDetail() {
  const { id } = useParams();
  useRouteA11y('Detalle de Vacante');
  const [vacante, setVacante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postulando, setPostulando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const { speakText } = useAccessibility();
  const { session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch(`/vacantes/${id}`)
      .then(data => setVacante(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePostular = async () => {
    setPostulando(true);
    setError('');
    setMensaje('');

    try {
      await apiFetch(`/postulaciones/${id}`, { method: 'POST' });
      setVacante(prev => ({ ...prev, ya_postulado: true }));
      setMensaje('¡Te has postulado con éxito! Te llevamos a tus postulaciones…');
      setTimeout(() => navigate('/postulaciones'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setPostulando(false);
    }
  };

  const handleLeerDetalle = () => {
    if (!vacante) return;
    const text = `Vacante para ${vacante.cargo} en ${vacante.nombre_empresa}. Ciudad: ${vacante.ciudad}. Modalidad: ${vacante.modalidad}. Salario: ${Number(vacante.salario).toLocaleString()} pesos. Descripción: ${vacante.descripcion}`;
    speakText(text);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4" aria-busy="true">
        <div className="skeleton h-10 w-2/3" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  if (!vacante) {
    return (
      <div className="empty-state max-w-xl mx-auto">
        <span className="text-slate-400" aria-hidden="true"><IconClipboard className="w-10 h-10 mx-auto" /></span>
        <h1 className="text-2xl font-bold text-brand-900" tabIndex={-1}>Vacante no encontrada</h1>
        <p className="text-slate-600">Es posible que ya no esté disponible.</p>
        <Link to="/vacantes" className="btn-navy mt-2">Ver vacantes disponibles</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/vacantes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:text-teal-600 focus-visible:ring-2 focus-visible:ring-orange-400 rounded">
        <IconArrowLeft className="w-4 h-4" /> Volver a vacantes
      </Link>

      <article className="card overflow-hidden">
        {/* Cabecera */}
        <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-7 md:p-10 space-y-4">
          <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-violet-600/25 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-28 left-1/3 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden="true" />
          <div className="relative space-y-4">
          <span className="eyebrow !text-emerald-300">{vacante.nombre_empresa} · {vacante.sector}</span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-balance" tabIndex={-1}>{vacante.cargo}</h1>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="badge bg-white/10 border-white/20 text-white"><IconMapPin className="w-3.5 h-3.5" /> {vacante.ciudad}</span>
            <span className="badge bg-white/10 border-white/20 text-white capitalize"><IconBriefcase className="w-3.5 h-3.5" /> {vacante.modalidad}</span>
            <span className="badge bg-white/10 border-white/20 text-white capitalize"><IconClock className="w-3.5 h-3.5" /> {vacante.jornada}</span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-300 pt-2">
            ${Number(vacante.salario).toLocaleString()} <span className="text-base font-semibold text-slate-300">COP / mes</span>
          </p>
          </div>
        </header>

        <div className="p-7 md:p-9 space-y-8">
          {mensaje && (
            <div role="status" className="alert-success">
              <IconCheck className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">¡Éxito!</p>
                <p>{mensaje}</p>
              </div>
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

          <section className="space-y-3" aria-labelledby="desc">
            <h2 id="desc" className="text-xl font-bold text-brand-900">Descripción del puesto</h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{vacante.descripcion}</p>
          </section>

          <section className="space-y-3" aria-labelledby="comp">
            <h2 id="comp" className="text-xl font-bold text-brand-900">Competencias requeridas</h2>
            <div className="flex flex-wrap gap-2">
              {vacante.requisitos?.map((req, idx) => (
                <span key={idx} className="chip chip-idle cursor-default hover:border-slate-300 hover:text-slate-700">
                  ✓ {req.nombre}
                </span>
              ))}
            </div>
          </section>

          <section aria-labelledby="acc" className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 space-y-4">
            <div>
              <h2 id="acc" className="text-xl font-bold text-brand-900">Accesibilidad y ajustes razonables</h2>
              <p className="text-sm text-slate-600 mt-1">
                Condiciones declaradas por la empresa. Las marcadas como verificadas cuentan con
                evidencia registrada por el equipo del proyecto.
              </p>
            </div>
            <ul className="grid sm:grid-cols-2 gap-3">
              {vacante.accesibilidad?.map((acc, idx) => (
                <li key={idx} className="bg-white p-4 rounded-xl border border-teal-200 shadow-sm flex gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center" aria-hidden="true">
                    <IconAccessibility className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="font-bold text-teal-900 text-sm">{acc.nombre}</p>
                    <p className="text-xs text-slate-600">{acc.descripcion}</p>
                    {acc.verificada ? (
                      <span className="badge-access text-[11px]">
                        <IconBadgeCheck className="w-3.5 h-3.5" /> Verificada
                      </span>
                    ) : (
                      <span className="badge-neutral text-[11px]">Declarada por la empresa</span>
                    )}
                    {acc.verificada && acc.evidencia && (
                      <p className="text-[11px] text-slate-500">Evidencia: {acc.evidencia}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Acciones */}
          <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-lift">
            <button onClick={handleLeerDetalle} className="btn-secondary">
              <IconSpeaker className="w-4 h-4" /> Escuchar vacante
            </button>

            {session.rol === 'candidato' ? (
              vacante.ya_postulado ? (
                <Link to="/postulaciones" className="btn-navy btn-lg">
                  <IconCheck className="w-5 h-5" /> Ya estás postulado
                </Link>
              ) : (
                <button onClick={handlePostular} disabled={postulando} className="btn-primary btn-lg">
                  {postulando ? 'Enviando postulación…' : 'Postularme a esta vacante'}
                </button>
              )
            ) : session.perfil ? (
              <Link to="/empresa" className="btn-secondary btn-lg">
                Estás en modo empresa
              </Link>
            ) : (
              <Link to="/login" className="btn-primary btn-lg">
                Inicia sesión para postularte
              </Link>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
