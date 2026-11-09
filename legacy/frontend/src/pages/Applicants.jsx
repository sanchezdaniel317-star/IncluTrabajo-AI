import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useRouteA11y } from '../hooks/useRouteA11y';
import {
  IconUsers, IconMail, IconMapPin, IconRobot, IconAccessibility,
  IconArrowLeft, IconCheck, IconAlert, IconClock
} from '../components/Icons';

const TRANSICIONES = {
  Postulado: ['En revisión', 'Entrevista', 'No seleccionado'],
  'En revisión': ['Entrevista', 'No seleccionado'],
  Entrevista: ['Contratado', 'No seleccionado'],
  Contratado: [],
  'No seleccionado': [],
  Retirada: [],
};

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
  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Applicants() {
  const { id } = useParams();
  useRouteA11y('Candidatos Postulados');
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [estados, setEstados] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [guardando, setGuardando] = useState(null);

  const cargar = useCallback(() => {
    setLoading(true);
    apiFetch(`/empresa/vacantes/${id}/candidatos`)
      .then(data => {
        setCandidatos(data);
        const inicial = {};
        data.forEach(post => { inicial[post.id] = TRANSICIONES[post.estado]?.[0] || post.estado; });
        setEstados(inicial);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const actualizarEstado = async (post) => {
    setError('');
    setMensaje('');
    setGuardando(post.id);
    try {
      await apiFetch(`/empresa/postulaciones/${post.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({
          estado: estados[post.id],
          comentario: comentarios[post.id] || '',
        }),
      });
      setMensaje(`Estado de ${post.nombre_candidato} actualizado a “${estados[post.id]}”.`);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/empresa" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:text-teal-600 focus-visible:ring-2 focus-visible:ring-orange-400 rounded">
          <IconArrowLeft className="w-4 h-4" /> Volver al panel de empresa
        </Link>
      </div>

      <header className="page-header">
        <div>
          <span className="eyebrow">Evaluación B2B explicable</span>
          <h1 className="page-title mt-1" tabIndex={-1}>Candidatos postulados</h1>
          <p className="page-subtitle">Ranking por compatibilidad actual, con la explicación del motor y el historial de cada proceso.</p>
        </div>
        {!loading && candidatos.length > 0 && (
          <span className="badge-brand text-sm px-4 py-2">
            {candidatos.length} candidato{candidatos.length !== 1 ? 's' : ''}
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
            <p className="font-bold">Error al cargar candidatos</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4" aria-busy="true">
          <div className="skeleton h-48" />
          <div className="skeleton h-48" />
        </div>
      ) : candidatos.length === 0 ? (
        <div className="empty-state">
          <span className="text-slate-400" aria-hidden="true"><IconUsers className="w-10 h-10 mx-auto" /></span>
          <p className="text-lg font-semibold text-slate-800">Aún no hay candidatos postulados a esta vacante.</p>
          <p className="text-sm text-slate-500">
            Los candidatos calificados verán tu publicación en sus recomendaciones.
          </p>
          <Link to="/empresa" className="btn-secondary mt-2">Volver al panel</Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {candidatos.map((post) => {
            const opciones = TRANSICIONES[post.estado] || [];
            const score = post.score_actual ?? post.score;
            return (
              <article key={post.id} className="card p-6 md:p-7 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-brand-900">{post.nombre_candidato}</h2>
                    <p className="text-sm text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-1.5"><IconMail className="w-4 h-4 text-slate-500" /> {post.email}</span>
                      <span className="inline-flex items-center gap-1.5"><IconMapPin className="w-4 h-4 text-slate-500" /> {post.ciudad}</span>
                      <span>Experiencia: <strong>{post.experiencia_anios} años</strong></span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`badge text-xs px-3 py-1 font-bold uppercase tracking-wider ${estadoStyle[post.estado] || estadoStyle.Postulado}`}>
                      {post.estado}
                    </span>
                    <div className={`score-pill ${post.compatibilidad_actual === false ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-teal-50 border-teal-300 text-teal-900'}`}>
                      <span className="text-3xl font-extrabold">{score}%</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide">
                        {post.compatibilidad_actual === false ? 'No compatible' : 'Compatibilidad actual'}
                      </span>
                    </div>
                  </div>
                </div>

                {post.competencias?.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Competencias declaradas:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {post.competencias.map((comp, idx) => (
                        <span key={idx} className="badge-neutral text-xs">✓ {comp.nombre}</span>
                      ))}
                    </div>
                  </div>
                )}

                {post.explicacion && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                    <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wide flex items-center gap-1.5">
                      <IconRobot className="w-4 h-4 text-teal-700" /> Razones del emparejamiento:
                    </h3>
                    <ul className="text-sm text-slate-700 space-y-1.5">
                      {post.explicacion.razones?.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <IconCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <IconAccessibility className="w-4 h-4" /> Ajustes de accesibilidad
                  </h3>
                  {post.consentimiento_datos ? (
                    post.necesidades?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {post.necesidades.map((nec, idx) => (
                          <span key={idx} className="badge-access">
                            {nec.nombre}{nec.critica ? ' · esencial' : ''}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">La persona no declaró necesidades de accesibilidad.</p>
                    )
                  ) : (
                    <p className="text-sm text-slate-600 rounded-xl bg-slate-50 border border-slate-200 p-3">
                      La persona no autorizó compartir sus necesidades de accesibilidad. El
                      emparejamiento se calculó internamente sin exponer esos datos.
                    </p>
                  )}
                </div>

                {post.historial?.length > 0 && (
                  <div className="text-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2">
                      <IconClock className="w-4 h-4" /> Historial
                    </h3>
                    <ol className="space-y-1.5">
                      {post.historial.map((evento, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" aria-hidden="true" />
                          <span>
                            <strong>{evento.estado_nuevo}</strong>
                            {evento.comentario ? ` · ${evento.comentario}` : ''}
                            <span className="text-xs text-slate-500"> · {formatoFecha(evento.creado_en)}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {opciones.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">Actualizar proceso</h3>
                    <div className="grid sm:grid-cols-[auto_1fr_auto] gap-3 items-end">
                      <div>
                        <label htmlFor={`estado-${post.id}`} className="field-label">Nuevo estado</label>
                        <select
                          id={`estado-${post.id}`}
                          value={estados[post.id] || ''}
                          onChange={e => setEstados(prev => ({ ...prev, [post.id]: e.target.value }))}
                          className="field-input cursor-pointer"
                        >
                          {opciones.map(opcion => (
                            <option key={opcion} value={opcion}>{opcion}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`comentario-${post.id}`} className="field-label">Retroalimentación (opcional)</label>
                        <input
                          id={`comentario-${post.id}`}
                          type="text"
                          value={comentarios[post.id] || ''}
                          onChange={e => setComentarios(prev => ({ ...prev, [post.id]: e.target.value }))}
                          className="field-input"
                          placeholder="Mensaje visible para la persona candidata"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => actualizarEstado(post)}
                        disabled={guardando === post.id}
                        className="btn-navy"
                      >
                        {guardando === post.id ? 'Guardando…' : 'Guardar estado'}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
