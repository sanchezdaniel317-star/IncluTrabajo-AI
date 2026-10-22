import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useRouteA11y } from '../hooks/useRouteA11y';
import DictationButton from '../components/DictationButton';
import { IconBriefcase, IconTarget, IconAccessibility, IconAlert, IconArrowLeft, IconInfo } from '../components/Icons';

export default function NewVacancy() {
  const { id } = useParams();
  const editando = Boolean(id);
  useRouteA11y(editando ? 'Editar Vacante' : 'Publicar Vacante');
  const [catalogos, setCatalogos] = useState({ competencias: [], necesidades: [] });
  const [form, setForm] = useState({
    cargo: '',
    descripcion: '',
    ciudad: 'Cartagena',
    modalidad: 'presencial',
    jornada: 'completa',
    salario: 2000000,
    competencia_ids: [],
    necesidad_ids: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const catData = await apiFetch('/catalogos');
        if (!activo) return;
        setCatalogos(catData);
        if (editando) {
          const vacantes = await apiFetch('/empresa/vacantes');
          if (!activo) return;
          const vacante = vacantes.find(v => String(v.id) === String(id));
          if (!vacante) {
            setError('La vacante no existe o no pertenece a tu empresa.');
            return;
          }
          setForm({
            cargo: vacante.cargo || '',
            descripcion: vacante.descripcion || '',
            ciudad: vacante.ciudad || '',
            modalidad: vacante.modalidad || 'presencial',
            jornada: vacante.jornada || 'completa',
            salario: Number(vacante.salario) || 0,
            competencia_ids: (vacante.requisitos || []).map(c => c.id),
            necesidad_ids: (vacante.accesibilidad || []).map(n => n.id),
          });
        }
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setLoading(false);
      }
    };
    cargar();
    return () => { activo = false; };
  }, [editando, id]);

  const toggleComp = (id) => {
    const exists = form.competencia_ids.includes(id);
    setForm({
      ...form,
      competencia_ids: exists ? form.competencia_ids.filter(i => i !== id) : [...form.competencia_ids, id]
    });
  };

  const toggleNec = (id) => {
    const exists = form.necesidad_ids.includes(id);
    setForm({
      ...form,
      necesidad_ids: exists ? form.necesidad_ids.filter(i => i !== id) : [...form.necesidad_ids, id]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    if (Number(form.salario) <= 0) {
      setError('Ingresa un salario mayor que cero.');
      setSaving(false);
      return;
    }
    try {
      await apiFetch(
        editando ? `/empresa/vacantes/${id}` : '/empresa/vacantes',
        {
          method: editando ? 'PATCH' : 'POST',
          body: JSON.stringify(form),
        }
      );
      navigate('/empresa');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4" aria-busy="true">
        <div className="skeleton h-10 w-1/2" />
        <div className="skeleton h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        to="/empresa"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition rounded-full px-2 py-1 -ml-2"
      >
        <IconArrowLeft className="w-4 h-4" />
        Volver al panel de empresa
      </Link>

      <header className="page-header">
        <div>
          <span className="eyebrow">Atracción de talento inclusivo</span>
          <h1 className="page-title mt-1" tabIndex={-1}>
            {editando ? 'Editar vacante inclusiva' : 'Publicar vacante inclusiva'}
          </h1>
          <p className="page-subtitle">
            Define competencias requeridas y el diagnóstico de accesibilidad para un emparejamiento preciso.
          </p>
        </div>
      </header>

      {error && (
        <div role="alert" className="alert-error">
          <IconAlert className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-7 md:p-9 space-y-8">
        <fieldset className="space-y-4">
          <legend className="section-legend">
            <IconBriefcase className="w-5 h-5 text-teal-700" /> Detalles del puesto
          </legend>

          <div>
            <label htmlFor="cargo" className="field-label">Título del cargo</label>
            <div className="flex items-center gap-2">
              <input
                id="cargo"
                type="text"
                value={form.cargo}
                onChange={e => setForm({ ...form, cargo: e.target.value })}
                className="field-input"
                placeholder="Ej. Auxiliar Administrativo Inclusivo"
                required
              />
              <DictationButton label="Dictar título del cargo" onTranscript={(text) => setForm(prev => ({ ...prev, cargo: text }))} />
            </div>
          </div>

          <div>
            <label htmlFor="descripcion" className="field-label">Descripción y funciones principales</label>
            <div className="flex items-start gap-2">
              <textarea
                id="descripcion"
                rows="4"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                className="field-input !min-h-[120px]"
                placeholder="Describe responsabilidades, ambiente de trabajo y dinámicas del puesto…"
                required
              ></textarea>
              <DictationButton
                label="Dictar descripción y funciones"
                onTranscript={(text) => setForm(prev => ({
                  ...prev,
                  descripcion: prev.descripcion ? `${prev.descripcion.trim()} ${text}` : text
                }))}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="ciudad" className="field-label">Ciudad</label>
              <div className="flex items-center gap-2">
                <input
                  id="ciudad"
                  type="text"
                  value={form.ciudad}
                  onChange={e => setForm({ ...form, ciudad: e.target.value })}
                  className="field-input"
                  required
                />
                <DictationButton label="Dictar ciudad de la vacante" onTranscript={(text) => setForm(prev => ({ ...prev, ciudad: text }))} />
              </div>
            </div>

            <div>
              <label htmlFor="salario" className="field-label">Salario mensual (COP)</label>
              <input
                id="salario"
                type="number"
                step="50000"
                value={form.salario}
                onChange={e => setForm({ ...form, salario: e.target.value })}
                className="field-input"
                required
              />
            </div>

            <div>
              <label htmlFor="modalidad" className="field-label">Modalidad</label>
              <select
                id="modalidad"
                value={form.modalidad}
                onChange={e => setForm({ ...form, modalidad: e.target.value })}
                className="field-input cursor-pointer"
              >
                <option value="presencial">Presencial</option>
                <option value="hibrido">Híbrido</option>
                <option value="remoto">Remoto</option>
              </select>
            </div>

            <div>
              <label htmlFor="jornada" className="field-label">Jornada laboral</label>
              <select
                id="jornada"
                value={form.jornada}
                onChange={e => setForm({ ...form, jornada: e.target.value })}
                className="field-input cursor-pointer"
              >
                <option value="completa">Tiempo completo</option>
                <option value="medio_tiempo">Medio tiempo</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Competencias requeridas */}
        <fieldset className="space-y-3">
          <legend className="section-legend">
            <IconTarget className="w-5 h-5 text-teal-700" /> Requisitos de competencia
          </legend>
          <p className="text-sm text-slate-600">Selecciona las habilidades necesarias para este cargo:</p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            {catalogos.competencias.map(comp => {
              const selected = form.competencia_ids.includes(comp.id);
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => toggleComp(comp.id)}
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

        {/* Checklist de Accesibilidad */}
        <fieldset className="space-y-3">
          <legend className="section-legend">
            <IconAccessibility className="w-5 h-5 text-teal-700" /> Checklist de accesibilidad del puesto
          </legend>
          <p className="text-sm text-slate-600">Marca las condiciones reales de accesibilidad disponibles:</p>
          <div className="flex items-start gap-2.5 rounded-xl bg-violet-50 border border-violet-200 p-3 text-sm text-violet-900">
            <IconInfo className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Estas condiciones quedan como <strong>declaradas por la empresa</strong>. El equipo del proyecto puede verificarlas y añadir evidencia.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            {catalogos.necesidades.map(nec => {
              const selected = form.necesidad_ids.includes(nec.id);
              return (
                <button
                  type="button"
                  key={nec.id}
                  onClick={() => toggleNec(nec.id)}
                  aria-pressed={selected}
                  className={`text-left p-4 rounded-xl border transition cursor-pointer focus-visible:ring-4 focus-visible:ring-orange-300 ${
                    selected
                      ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-600/30 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <IconAccessibility className="w-4 h-4 text-teal-700" /> {nec.nombre}
                      </p>
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

        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary btn-lg w-full"
          >
            {saving
              ? (editando ? 'Guardando cambios…' : 'Publicando vacante…')
              : (editando ? 'Guardar cambios' : 'Publicar vacante inclusiva')}
          </button>
        </div>
      </form>
    </div>
  );
}
