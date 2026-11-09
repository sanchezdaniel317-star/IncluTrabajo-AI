import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { useRouteA11y } from '../hooks/useRouteA11y';
import { IconUser, IconBuilding, IconArrowLeft, IconCheck, IconAlert } from '../components/Icons';

export default function Register() {
  useRouteA11y('Crear cuenta');
  const { register } = useSession();
  const navigate = useNavigate();
  const [rol, setRol] = useState('candidato');
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmar: '',
    ciudad: '',
    sector: '',
    telefono: '',
    consentimiento_datos: false,
    acepta_terminos: false,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setSaving(true);
    try {
      await register({
        rol,
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        ciudad: form.ciudad,
        sector: form.sector,
        telefono: form.telefono,
        consentimiento_datos: form.consentimiento_datos,
        acepta_terminos: form.acepta_terminos,
      });
      navigate('/inicio');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const esCandidato = rol === 'candidato';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition rounded-full px-2 py-1 -ml-2"
      >
        <IconArrowLeft className="w-4 h-4" />
        Volver al inicio de sesión
      </Link>

      <header className="text-center space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-900/5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
          Acceso gratuito para personas
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900" tabIndex={-1}>
          Crea tu cuenta en <span className="text-gradient">IncluTrabajo AI</span>
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-balance">
          Un solo registro para explorar vacantes accesibles o publicar oportunidades inclusivas.
        </p>
      </header>

      {error && (
        <div role="alert" className="alert-error" id="registro-error">
          <IconAlert className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">No pudimos crear la cuenta</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-7 md:p-9 space-y-7" noValidate>
        <fieldset>
          <legend className="section-legend">¿Cómo vas a usar la plataforma?</legend>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { valor: 'candidato', titulo: 'Busco empleo', texto: 'Perfil, accesibilidad y coincidencias con IA.', Icon: IconUser },
              { valor: 'empresa', titulo: 'Soy empresa', texto: 'Publica vacantes y evalúa talento diverso.', Icon: IconBuilding },
            ].map(({ valor, titulo, texto, Icon }) => {
              const activo = rol === valor;
              return (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setRol(valor)}
                  aria-pressed={activo}
                  className={`text-left p-4 rounded-2xl border transition focus-visible:ring-4 focus-visible:ring-violet-200 ${
                    activo
                      ? 'bg-violet-50 border-violet-500 ring-2 ring-violet-500/20 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${
                      activo ? 'bg-violet-600 text-white ring-violet-600' : 'bg-white text-slate-600 ring-slate-200'
                    }`} aria-hidden="true">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="space-y-0.5">
                      <span className="block font-bold text-slate-900">{titulo}</span>
                      <span className="block text-xs text-slate-600 leading-relaxed">{texto}</span>
                    </span>
                    {activo && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center" aria-hidden="true">
                        <IconCheck className="w-3 h-3" strokeWidth={3} />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="section-legend">Datos de la cuenta</legend>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label htmlFor="nombre" className="field-label">
                {esCandidato ? 'Nombre completo' : 'Nombre de la empresa'}
              </label>
              <input
                id="nombre"
                type="text"
                autoComplete={esCandidato ? 'name' : 'organization'}
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                className="field-input"
                placeholder={esCandidato ? 'Ej. María Fernanda López' : 'Ej. Empresa Inclusiva S.A.S.'}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'registro-error' : undefined}
              />
            </div>

            <div>
              <label htmlFor="email" className="field-label">Correo electrónico</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                className="field-input"
                placeholder="tu.correo@ejemplo.com"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'registro-error' : undefined}
              />
            </div>

            <div>
              <label htmlFor="ciudad" className="field-label">Ciudad</label>
              <input
                id="ciudad"
                type="text"
                autoComplete="address-level2"
                value={form.ciudad}
                onChange={e => set('ciudad', e.target.value)}
                className="field-input"
                placeholder="Ej. Cartagena"
                required
              />
            </div>

            {esCandidato ? (
              <div>
                <label htmlFor="telefono" className="field-label">Teléfono (opcional)</label>
                <input
                  id="telefono"
                  type="tel"
                  autoComplete="tel"
                  value={form.telefono}
                  onChange={e => set('telefono', e.target.value)}
                  className="field-input"
                  placeholder="Ej. 300 123 4567"
                />
                <p className="field-hint">Es privado: no se muestra a las empresas.</p>
              </div>
            ) : (
              <div>
                <label htmlFor="sector" className="field-label">Sector de la empresa</label>
                <input
                  id="sector"
                  type="text"
                  value={form.sector}
                  onChange={e => set('sector', e.target.value)}
                  className="field-input"
                  placeholder="Ej. Tecnología, comercio, salud…"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="field-label">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                className="field-input"
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
                aria-describedby="password-hint"
              />
              <p id="password-hint" className="field-hint">Usa al menos 8 caracteres.</p>
            </div>

            <div>
              <label htmlFor="confirmar" className="field-label">Confirmar contraseña</label>
              <input
                id="confirmar"
                type="password"
                autoComplete="new-password"
                value={form.confirmar}
                onChange={e => set('confirmar', e.target.value)}
                className="field-input"
                placeholder="Repite la contraseña"
                minLength={8}
                required
                aria-invalid={Boolean(error) && form.confirmar.length > 0 && form.password !== form.confirmar}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <legend className="sr-only">Consentimientos</legend>
          {esCandidato && (
            <label htmlFor="consentimiento" className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
              <input
                id="consentimiento"
                type="checkbox"
                checked={form.consentimiento_datos}
                onChange={e => set('consentimiento_datos', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-400 text-violet-600 focus:ring-violet-500"
                required
              />
              <span>
                <strong>Autorizo</strong> el tratamiento de mis datos de accesibilidad para calcular
                coincidencias y, si lo decido, compartirlos con empresas. Puedo revocar este permiso
                desde mi perfil.
              </span>
            </label>
          )}
          <label htmlFor="terminos" className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
            <input
              id="terminos"
              type="checkbox"
              checked={form.acepta_terminos}
              onChange={e => set('acepta_terminos', e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-400 text-violet-600 focus:ring-violet-500"
              required
            />
            <span>
              Acepto los términos de uso y la{' '}
              <Link to="/privacidad" className="font-semibold text-violet-700 underline underline-offset-2">
                política de privacidad
              </Link>
              .
            </span>
          </label>
          {!esCandidato && (
            <p className="text-xs text-slate-600">
              El acceso de empresas es gratuito durante la fase de demostración del proyecto.
            </p>
          )}
        </fieldset>

        <div className="space-y-3 pt-2 border-t border-slate-200">
          <button type="submit" disabled={saving} className="btn-primary btn-lg w-full">
            {saving ? 'Creando cuenta…' : 'Crear mi cuenta'}
          </button>
          <p className="text-center text-sm text-slate-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-violet-700 underline underline-offset-2">
              Inicia sesión
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
