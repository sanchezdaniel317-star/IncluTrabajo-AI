import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import SkipLink from './SkipLink';
import AccessibilityBar from './AccessibilityBar';
import NavBar from './NavBar';
import LiveRegion from './LiveRegion';

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col text-slate-900">
      <SkipLink />
      <AccessibilityBar />
      <NavBar />
      <LiveRegion />

      <main id="main-content" className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div key={pathname} className="animate-fade-up">
          {children}
        </div>
      </main>

      <footer className="relative mt-auto bg-slate-950 text-slate-400 overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-96 h-48 rounded-full bg-violet-600/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 right-1/4 w-96 h-48 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-3 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-extrabold" aria-hidden="true">IA</span>
              <p className="text-base font-extrabold text-white">IncluTrabajo AI</p>
            </div>
            <p className="text-slate-400 leading-relaxed">Empleo inclusivo para todas las personas. Emparejamiento transparente y accesible.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <Link to="/privacidad" className="text-slate-300 hover:text-white underline underline-offset-4 rounded">Política de privacidad</Link>
              <Link to="/ayuda" className="text-slate-300 hover:text-white underline underline-offset-4 rounded">Ayuda y accesibilidad</Link>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Principios</p>
            <ul className="space-y-2 text-slate-400">
              <li>Accesibilidad WCAG 2.2 en todas las pantallas</li>
              <li>IA explicable sin sesgos demográficos</li>
              <li>Ajustes razonables verificables en cada vacante</li>
            </ul>
          </div>
          <div className="space-y-2 md:text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">IncluTrabajo AI</p>
            <p className="text-slate-200 font-medium">Empleo inclusivo</p>
            <p className="text-slate-400 text-xs">Demostración funcional</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
