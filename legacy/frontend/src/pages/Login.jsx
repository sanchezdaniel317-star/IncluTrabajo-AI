import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useSession } from '../contexts/SessionContext';
import { useRouteA11y } from '../hooks/useRouteA11y';
import { IconUser, IconBuilding, IconArrowLeft, IconInfo, IconMail, IconLock } from '../components/Icons';

function PerfilOption({ perfil, onSelect, tone, cargando, deshabilitado }) {
  const hover = tone === 'teal'
    ? 'hover:ring-emerald-300 hover:shadow-emerald-500/10'
    : 'hover:ring-violet-300 hover:shadow-violet-500/10';
  const avatarBg = tone === 'teal'
    ? 'bg-gradient-to-br from-emerald-700 to-teal-900 shadow-emerald-800/25'
    : 'bg-gradient-to-br from-violet-500 to-indigo-700 shadow-indigo-600/25';
  const initials = perfil.nombre.split(' ').slice(0, 2).map(p => p[0]).join('');
  return (
    <button
      type="button"
      onClick={() => onSelect(perfil.id)}
      disabled={Boolean(deshabilitado)}
      aria-label={`Entrar como ${perfil.nombre} (${perfil.rol})`}
      className={`group w-full flex items-center gap-3 sm:gap-4 text-left bg-slate-50 p-4 rounded-2xl ring-1 ring-slate-200 shadow-sm transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-4 focus-visible:ring-violet-200 disabled:opacity-60 disabled:cursor-wait ${hover}`}
    >
      <span className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl ${avatarBg} text-white text-sm font-bold flex items-center justify-center shadow-lg`} aria-hidden="true">
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-slate-900 leading-snug">{perfil.nombre}</span>
        <span className="block text-xs text-slate-600 truncate">{perfil.email}</span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-slate-600 group-hover:text-orange-700 transition" aria-hidden="true">
        {cargando ? 'Entrando…' : (<><span className="hidden sm:inline">Entrar </span>→</>)}
      </span>
    </button>
  );
}

export default function Login() {
  useRouteA11y('Iniciar sesión');
  const [perfiles, setPerfiles] = useState([]);
  const [loadingCuentas, setLoadingCuentas] = useState(true);
  const [entrando, setEntrando] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const { session, login, loginDemo, logout } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/auth/demo-cuentas')
      .then(data => setPerfiles(data))
      .catch(() => setPerfiles([]))
      .finally(() => setLoadingCuentas(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(email.trim(), password, recordar);
      navigate('/inicio');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleDemo = async (perfilId) => {
    setError('');
    setEntrando(perfilId);
    try {
      await loginDemo(perfilId);
      navigate('/inicio');
    } catch (err) {
      setError(err.message);
      setEntrando(null);
    }
  };

  const handleCambiarCuenta = async () => {
    await logout();
    setError('');
  };

  const candidatos = perfiles.filter(p => p.rol === 'candidato');
  const empresas = perfiles.filter(p => p.rol === 'empresa');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition rounded-full px-2 py-1 -ml-2"
      >
        <IconArrowLeft className="w-4 h-4" />
        Volver a la bienvenida
      </Link>

      <header className="text-center space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-900/5 shadow-sm">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          Acceso a la plataforma
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900" tabIndex={-1}>
          Inicia sesión en <span className="text-gradient">IncluTrabajo AI</span>
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-balance">
          Entra con tu correo y contraseña, o prueba la plataforma con una cuenta de demostración.
        </p>
      </header>

      {session.perfil && (
        <div className="max-w-xl mx-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-violet-50 ring-1 ring-violet-200 p-4 text-sm">
          <p className="text-violet-900">
            Ya tienes una sesión activa como <strong>{session.perfil.nombre}</strong>.
          </p>
          <div className="flex gap-2">
            <Link to="/inicio" className="btn-primary btn-sm">Continuar</Link>
            <button type="button" onClick={handleCambiarCuenta} className="btn-secondary btn-sm">
              Cambiar de cuenta
            </button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="alert-error max-w-xl mx-auto" id="login-error">
          <span aria-hidden="true" className="font-bold">!</span>
          <div>
            <p className="font-bold">No pudimos iniciar sesión</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <section aria-labelledby="form-login" className="card max-w-xl mx-auto p-7 md:p-8 space-y-5">
        <h2 id="form-login" className="text-xl font-bold text-slate-900">Con tu cuenta</h2>
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="field-label">Correo electrónico</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">
                <IconMail className="w-5 h-5" />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="field-input pl-11"
                placeholder="tu.correo@ejemplo.com"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="field-label">Contraseña</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">
                <IconLock className="w-5 h-5" />
              </span>
              <input
                id="password"
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="field-input pl-11 pr-24"
                placeholder="Tu contraseña"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'login-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-violet-400"
                aria-pressed={mostrarPassword}
              >
                {mostrarPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="recordar" className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                id="recordar"
                type="checkbox"
                checked={recordar}
                onChange={e => setRecordar(e.target.checked)}
                className="w-4 h-4 rounded border-slate-400 text-violet-600 focus:ring-violet-500"
              />
              Mantener mi sesión
            </label>
            <Link to="/registro" className="text-sm font-semibold text-violet-700 hover:text-violet-900 underline underline-offset-2 rounded">
              Crear una cuenta
            </Link>
          </div>

          <button type="submit" disabled={enviando} className="btn-primary w-full btn-lg">
            {enviando ? 'Ingresando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-xs text-slate-600 leading-relaxed">
          Al iniciar sesión aceptas nuestra{' '}
          <Link to="/privacidad" className="font-semibold text-violet-700 underline underline-offset-2">
            política de privacidad
          </Link>
          . Si olvidaste tu contraseña, contacta al equipo del proyecto.
        </p>
      </section>

      <div className="flex items-center gap-4 max-w-4xl mx-auto" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-300/70" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">o usa una cuenta demo</span>
        <span className="h-px flex-1 bg-slate-300/70" />
      </div>

      <section aria-labelledby="cuentas-demo" className="space-y-4">
        <div className="text-center space-y-1">
          <h2 id="cuentas-demo" className="text-lg font-bold text-slate-900">Cuentas de demostración</h2>
          <p className="text-sm text-slate-600">Entra con un clic. Contraseña de todas: <strong>Demo2026!</strong></p>
        </div>

        {loadingCuentas ? (
          <div className="grid md:grid-cols-2 gap-8" aria-busy="true">
            <div className="skeleton h-72" />
            <div className="skeleton h-72" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card p-7 space-y-5">
              <div className="flex items-start gap-4">
                <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 flex items-center justify-center" aria-hidden="true">
                  <IconUser className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Buscar empleo</h3>
                  <p className="text-sm text-slate-600 mt-0.5">Explora vacantes, arma tu perfil accesible y recibe emparejamiento con IA.</p>
                </div>
              </div>
              <div className="space-y-3">
                {candidatos.map(p => (
                  <PerfilOption key={p.id} perfil={p} onSelect={handleDemo} tone="teal" cargando={entrando === p.id} deshabilitado={entrando !== null} />
                ))}
              </div>
            </div>

            <div className="card p-7 space-y-5">
              <div className="flex items-start gap-4">
                <span className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100 flex items-center justify-center" aria-hidden="true">
                  <IconBuilding className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Empresa cliente</h3>
                  <p className="text-sm text-slate-600 mt-0.5">Publica vacantes con checklist de accesibilidad y evalúa talento diverso.</p>
                </div>
              </div>
              <div className="space-y-3">
                {empresas.map(p => (
                  <PerfilOption key={p.id} perfil={p} onSelect={handleDemo} tone="navy" cargando={entrando === p.id} deshabilitado={entrando !== null} />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-2xl bg-white/70 ring-1 ring-slate-900/10 shadow-sm p-4 text-sm text-slate-600 max-w-4xl mx-auto">
        <IconInfo className="w-5 h-5 shrink-0 text-violet-600 mt-0.5" />
        <p>
          Las cuentas demo son de prueba. Los usuarios registrados entran con su propio correo y contraseña;
          las cuentas demo no permiten suplantar a personas reales.
        </p>
      </div>
    </div>
  );
}
