import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useRouteA11y } from '../hooks/useRouteA11y';
import DictationButton from '../components/DictationButton';
import { IconUser, IconTarget, IconAccessibility, IconCheck, IconAlert } from '../components/Icons';

export default function CandidateProfile() {
  useRouteA11y('Mi Perfil');
  const [perfil, setPerfil] = useState(null);
  const [catalogos, setCatalogos] = useState({ competencias: [], necesidades: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/candidato/perfil'),
      apiFetch('/catalogos')
    ])
      .then(([perfilData, catData]) => {
        setPerfil(perfilData);
        setCatalogos(catData);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMensaje('');
    setError('');

    try {
      const payload = {
        nombre: perfil.nombre,
        ciudad: perfil.ciudad,
        telefono: perfil.telefono,
        experiencia_anios: parseInt(perfil.experiencia_anios) || 0,
        modalidad_pref: perfil.modalidad_pref,
        jornada_pref: perfil.jornada_pref,
        salario_min: parseFloat(perfil.salario_min) || 0,
        competencia_ids: perfil.competencias.map(c => c.id),
        necesidades: perfil.necesidades.map(n => ({ id: n.id, critica: Boolean(n.critica) })),
        consentimiento_datos: Boolean(perfil.consentimiento_datos)
      };

      await apiFetch('/candidato/perfil', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setMensaje('Perfil guardado con éxito.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCompetencia = (comp) => {
    const exists = perfil.competencias.some(c => c.id === comp.id);
    const updated = exists
      ? perfil.competencias.filter(c => c.id !== comp.id)
      : [...perfil.competencias, comp];
    setPerfil({ ...perfil, competencias: updated });
  };

  const toggleNecesidad = (nec) => {
    const exists = perfil.necesidades.some(n => n.id === nec.id);
    const updated = exists
      ? perfil.necesidades.filter(n => n.id !== nec.id)
      : [...perfil.necesidades, { ...nec, critica: false }];
    setPerfil({ ...perfil, necesidades: updated });
  };

  const toggleCritica = (necId) => {
    setPerfil({
      ...perfil,
      necesidades: perfil.necesidades.map(n =>
        n.id === necId ? { ...n, critica: !n.critica } : n
      ),
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4" aria-busy="true">
        <div className="skeleton h-10 w-1/2" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  const indicadores = [
    perfil.nombre?.trim(),
    perfil.ciudad?.trim(),
    Number(perfil.salario_min) > 0,
    perfil.competencias?.length > 0,
    perfil.necesidades?.length > 0,
    perfil.consentimiento_datos,
  ];
  const completitud = Math.round((indicadores.filter(Boolean).length / indicadores.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="page-header">
        <div>
          <span className="eyebrow">Ajustes personales</span>
          <h1 className="page-title mt-1" tabIndex={-1}>Mi perfil y accesibilidad</h1>
          <p className="page-subtitle">
            Declara tus competencias y requerimientos de accesibilidad para que el motor de IA evalúe tu compatibilidad sin sesgos.
          </p>
        </div>
      </header>

      <div className="card p-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-900">Perfil completo: {completitud}%</p>
          <p className="text-xs text-slate-600">
            {completitud === 100
              ? 'Todo listo para calcular coincidencias precisas.'
              : 'Completa tus datos para mejorar la confianza del emparejamiento.'}
          </p>
        </div>
        <div
          className="h-2 rounded-full bg-slate-200 overflow-hidden"
          role="progressbar"
          aria-valuenow={completitud}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Completitud del perfil"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all"
            style={{ width: `${completitud}%` }}
          />
        </div>
      </div>

      {mensaje && (
        <div role="status" className="alert-success">
          <IconCheck className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">¡Guardado!</p>
            <p>{mensaje}</p>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="alert-error">
          <IconAlert className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Error al guardar</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-7 md:p-9 space-y-8">
        {/* Datos Personales */}
        <fieldset className="space-y-4">
          <legend className="section-legend">
            <IconUser className="w-5 h-5 text-teal-700" /> Información general
          </legend>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="nombre" className="field-label">Nombre completo</label>
              <div className="flex items-center gap-2">
                <input
                  id="nombre"
                  type="text"
                  value={perfil.nombre || ''}
                  onChange={e => setPerfil({ ...perfil, nombre: e.target.value })}
                  className="field-input"
                  required
                />
                <DictationButton label="Dictar nombre completo" onTranscript={(text) => setPerfil(prev => ({ ...prev, nombre: text }))} />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="field-label">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={perfil.email || ''}
                disabled
                className="field-input"
              />
              <p className="field-hint">El correo está vinculado a tu perfil de sesión.</p>
            </div>

            <div>
              <label htmlFor="ciudad" className="field-label">Ciudad de residencia</label>
              <div className="flex items-center gap-2">
                <input
                  id="ciudad"
                  type="text"
                  value={perfil.ciudad || ''}
                  onChange={e => setPerfil({ ...perfil, ciudad: e.target.value })}
                  className="field-input"
                  required
                />
                <DictationButton label="Dictar ciudad" onTranscript={(text) => setPerfil(prev => ({ ...prev, ciudad: text }))} />
              </div>
            </div>

            <div>
              <label htmlFor="telefono" className="field-label">Teléfono / WhatsApp</label>
              <div className="flex items-center gap-2">
                <input
                  id="telefono"
                  type="text"
                  value={perfil.telefono || ''}
                  onChange={e => setPerfil({ ...perfil, telefono: e.target.value })}
                  className="field-input"
                />
                <DictationButton label="Dictar teléfono" onTranscript={(text) => setPerfil(prev => ({ ...prev, telefono: text.replace(/\s+/g, '') }))} />
              </div>
            </div>

            <div>
              <label htmlFor="experiencia" className="field-label">Años de experiencia laboral</label>
              <input
                id="experiencia"
                type="number"
                min="0"
                value={perfil.experiencia_anios ?? 0}
                onChange={e => setPerfil({ ...perfil, experiencia_anios: e.target.value })}
                className="field-input"
              />
            </div>

            <div>
              <label htmlFor="salario" className="field-label">Aspiración salarial mínima (COP)</label>
              <input
                id="salario"
                type="number"
                step="50000"
                value={perfil.salario_min ?? 0}
                onChange={e => setPerfil({ ...perfil, salario_min: e.target.value })}
                className="field-input"
              />
            </div>

            <div>
              <label htmlFor="modalidad" className="field-label">Modalidad preferida</label>
              <select
                id="modalidad"
                value={perfil.modalidad_pref || 'cualquiera'}
                onChange={e => setPerfil({ ...perfil, modalidad_pref: e.target.value })}
                className="field-input cursor-pointer"
              >
                <option value="cualquiera">Cualquiera</option>
                <option value="remoto">Remoto</option>
                <option value="hibrido">Híbrido</option>
                <option value="presencial">Presencial</option>
              </select>
            </div>

            <div>
              <label htmlFor="jornada" className="field-label">Jornada preferida</label>
              <select
                id="jornada"
                value={perfil.jornada_pref || 'completa'}
                onChange={e => setPerfil({ ...perfil, jornada_pref: e.target.value })}
                className="field-input cursor-pointer"
              >
                <option value="completa">Tiempo completo</option>
                <option value="medio_tiempo">Medio tiempo</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Competencias */}
        <fieldset className="space-y-3">
          <legend className="section-legend">
            <IconTarget className="w-5 h-5 text-teal-700" /> Competencias y habilidades
          </legend>
          <p className="text-sm text-slate-600">Selecciona las fortalezas y conocimientos que posees:</p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            {catalogos.competencias.map(comp => {
              const selected = perfil.competencias.some(c => c.id === comp.id);
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => toggleCompetencia(comp)}
                  className={selected ? 'chip chip-active' : 'chip chip-idle'}
                  aria-pressed={selected}
                >
                  {comp.nombre}
                  {selected && <span aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Necesidades de accesibilidad */}
        <fieldset className="space-y-3">
          <legend className="section-legend">
            <IconAccessibility className="w-5 h-5 text-teal-700" /> Necesidades y preferencias de accesibilidad
          </legend>
          <p className="text-sm text-slate-600">Indica qué ajustes razonables facilitan tu desempeño diario:</p>
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {catalogos.necesidades.map(nec => {
              const selected = perfil.necesidades.some(n => n.id === nec.id);
              return (
                <button
                  type="button"
                  key={nec.id}
                  onClick={() => toggleNecesidad(nec)}
                  aria-pressed={selected}
                  className={`text-left p-4 rounded-xl border transition cursor-pointer focus-visible:ring-4 focus-visible:ring-orange-300 ${
                    selected
                      ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-600/30 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-sm">{nec.nombre}</p>
                      <p className="text-xs text-slate-500 leading-normal">{nec.descripcion}</p>
                    </div>
                    <span className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center font-bold text-xs ${
                      selected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 text-transparent'
                    }`} aria-hidden="true">✓</span>
                  </div>
                </button>
              );
            })}
          </div>
        </fieldset>

        {perfil.necesidades.length > 0 && (
          <fieldset className="space-y-3 rounded-2xl bg-amber-50/60 border border-amber-200 p-5">
            <legend className="text-base font-bold text-slate-900 px-1">
              ¿Cuáles son imprescindibles?
            </legend>
            <p className="text-sm text-slate-700">
              Marca las necesidades que no pueden faltar. Si una es esencial y el puesto no la
              declara, la vacante se marcará como no compatible.
            </p>
            <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
              {perfil.necesidades.map(nec => (
                <label
                  key={nec.id}
                  htmlFor={`critica-${nec.id}`}
                  className="flex items-start gap-2.5 rounded-xl bg-white border border-slate-200 p-3 text-sm text-slate-700 cursor-pointer hover:border-amber-300"
                >
                  <input
                    id={`critica-${nec.id}`}
                    type="checkbox"
                    checked={Boolean(nec.critica)}
                    onChange={() => toggleCritica(nec.id)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-400 text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    <strong className="block text-slate-900">{nec.nombre}</strong>
                    <span className="text-xs text-slate-600">Necesidad esencial</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <label htmlFor="consentimiento" className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 cursor-pointer">
          <input
            id="consentimiento"
            type="checkbox"
            checked={Boolean(perfil.consentimiento_datos)}
            onChange={e => setPerfil({ ...perfil, consentimiento_datos: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded border-slate-400 text-violet-600 focus:ring-violet-500"
          />
          <span>
            <strong>Autorizo compartir mis necesidades de accesibilidad</strong> con las empresas a
            las que me postulo. Si lo desactivo, el emparejamiento sigue funcionando, pero las
            empresas no verán esos datos. Más información en la{' '}
            <Link to="/privacidad" className="font-semibold text-violet-700 underline underline-offset-2">
              política de privacidad
            </Link>
            .
          </span>
        </label>

        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary btn-lg w-full"
          >
            {saving ? 'Guardando cambios…' : 'Guardar perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}
