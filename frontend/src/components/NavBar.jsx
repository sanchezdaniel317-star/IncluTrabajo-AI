import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { apiFetch } from '../api/client';
import { IconBell } from './Icons';

export default function NavBar() {
  const { session, logout } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    if (!session.perfil) {
      setNoLeidas(0);
      return;
    }
    apiFetch('/notificaciones')
      .then(data => setNoLeidas(data.no_leidas || 0))
      .catch(() => setNoLeidas(0));
  }, [session.perfil, pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = session.perfil?.nombre
    ?.split(' ')
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase();

  return (
    <header className="md:sticky md:top-0 z-40 glass border-b border-slate-900/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link to={session.perfil ? '/inicio' : '/'} className="flex items-center gap-3 rounded-full p-1 pr-3 hover:bg-slate-900/5 transition focus-visible:ring-4 focus-visible:ring-violet-200">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-indigo-700 flex items-center justify-center font-extrabold text-white shadow-lg shadow-indigo-600/25" aria-hidden="true">
            IA
          </div>
          <div className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight text-slate-900">IncluTrabajo AI</span>
            <span className="block text-[11px] text-slate-500">Empleo inclusivo para todas las personas</span>
          </div>
        </Link>

        <nav aria-label="Navegación principal" className="flex items-center gap-1 flex-wrap">
          {session.perfil ? (
            <>
              {session.rol === 'candidato' && (
                <>
                  <NavLink to="/inicio" end className="nav-link">Inicio</NavLink>
                  <NavLink to="/perfil" className="nav-link">Mi Perfil</NavLink>
                  <NavLink to="/coincidencias" className="nav-link">Emparejamiento IA</NavLink>
                  <NavLink to="/vacantes" className="nav-link">Vacantes</NavLink>
                  <NavLink to="/postulaciones" className="nav-link">Mis Postulaciones</NavLink>
                </>
              )}

              {session.rol === 'empresa' && (
                <>
                  <NavLink to="/empresa" end className="nav-link">Panel Empresa</NavLink>
                  <NavLink to="/empresa/vacantes/nueva" className="nav-link">Publicar Vacante</NavLink>
                  <NavLink to="/vacantes" className="nav-link">Vacantes</NavLink>
                </>
              )}

              <NavLink
                to="/notificaciones"
                className="nav-link inline-flex items-center gap-1.5"
                aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} sin leer)` : ''}`}
              >
                <IconBell className="w-4 h-4" />
                <span className="hidden sm:inline">Avisos</span>
                {noLeidas > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center" aria-hidden="true">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </NavLink>

              <NavLink to="/ayuda" className="nav-link">Ayuda</NavLink>

              <div className="flex items-center gap-3 pl-3 ml-2 border-l border-slate-200">
                <div className="hidden sm:flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white shadow" aria-hidden="true">
                    {initials}
                  </span>
                  <div className="text-left leading-tight">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                      {session.rol === 'candidato' ? 'Candidato' : 'Empresa'}
                    </span>
                    <span className="block font-semibold text-sm text-slate-900 max-w-[160px] truncate">{session.perfil.nombre}</span>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn-secondary btn-sm">
                  Cambiar rol
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/vacantes" className="nav-link">Vacantes</NavLink>
              <NavLink to="/ayuda" className="nav-link">Ayuda</NavLink>
              <Link to="/registro" className="btn-secondary btn-sm hidden sm:inline-flex">
                Crear cuenta
              </Link>
              <Link to="/login" className="btn-primary btn-sm ml-1">
                Iniciar sesión
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
