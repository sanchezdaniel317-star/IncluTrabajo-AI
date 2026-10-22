import React from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { useRouteA11y } from '../hooks/useRouteA11y';
import {
  IconTarget, IconRobot, IconAccessibility,
  IconSparkles, IconDocument, IconInbox, IconClipboard, IconPlus, IconArrowRight
} from '../components/Icons';

const features = [
  { Icon: IconTarget, title: 'Enfoque universal', text: 'Diseñado para todas las personas con accesibilidad transversal (WCAG 2.2), sin etiquetas ni discriminación.', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  { Icon: IconRobot, title: 'IA explicable', text: 'Un algoritmo transparente que compara competencias reales con las condiciones funcionales del puesto.', tone: 'bg-violet-50 text-violet-700 ring-violet-100' },
  { Icon: IconAccessibility, title: 'Ajustes razonables', text: 'Verificamos accesibilidad física y tecnológica para una inserción laboral exitosa y sostenible.', tone: 'bg-slate-100 text-slate-700 ring-slate-200' },
];

const accionesCandidato = [
  { to: '/coincidencias', title: 'Emparejamiento IA', text: 'Vacantes ordenadas por compatibilidad, con razones claras.', Icon: IconSparkles, tone: 'bg-violet-600' },
  { to: '/perfil', title: 'Completar mi perfil', text: 'Competencias, experiencia y necesidades de accesibilidad.', Icon: IconDocument, tone: 'bg-slate-900' },
  { to: '/postulaciones', title: 'Mis postulaciones', text: 'Sigue el estado de cada postulación.', Icon: IconInbox, tone: 'bg-emerald-600' },
];

const accionesEmpresa = [
  { to: '/empresa', title: 'Panel de vacantes', text: 'Revisa y administra tus publicaciones activas.', Icon: IconClipboard, tone: 'bg-slate-900' },
  { to: '/empresa/vacantes/nueva', title: 'Publicar vacante', text: 'Crea una oferta con checklist de accesibilidad real.', Icon: IconPlus, tone: 'bg-violet-600' },
];

export default function Home() {
  useRouteA11y('Inicio');
  const { session } = useSession();

  if (!session.perfil) return null;

  const esCandidato = session.rol === 'candidato';
  const acciones = esCandidato ? accionesCandidato : accionesEmpresa;

  return (
    <div className="space-y-12">
      {/* Bienvenida */}
      <section className="relative overflow-hidden rounded-[2rem] bg-white ring-1 ring-slate-900/10 shadow-soft p-8 md:p-12">
        <div className="absolute -top-32 -right-20 w-[24rem] h-[24rem] rounded-full bg-violet-300/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-28 -left-16 w-[20rem] h-[20rem] rounded-full bg-emerald-300/25 blur-3xl" aria-hidden="true" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-900/5 shadow-sm uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {esCandidato ? 'Buscador de empleo' : 'Empresa cliente'}
            </span>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 text-balance" tabIndex={-1}>
              Hola, <span className="text-gradient">{session.perfil.nombre}</span>
            </h1>

            <p className="text-slate-500 text-lg text-balance leading-relaxed">
              {esCandidato
                ? 'Tu talento importa. Explora oportunidades compatibles con tus competencias y necesidades de accesibilidad.'
                : 'Gestiona tus vacantes inclusivas, define ajustes razonables y conecta con talento diverso.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            {esCandidato ? (
              <>
                <Link to="/coincidencias" className="btn-primary btn-lg">Ver emparejamiento IA</Link>
                <Link to="/perfil" className="btn-secondary btn-lg">Editar mi perfil</Link>
              </>
            ) : (
              <>
                <Link to="/empresa" className="btn-navy btn-lg">Panel de vacantes</Link>
                <Link to="/empresa/vacantes/nueva" className="btn-primary btn-lg">Publicar vacante</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section aria-labelledby="accesos" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="accesos" className="text-2xl font-bold tracking-tight text-slate-900">Accesos rápidos</h2>
            <p className="text-sm text-slate-500 mt-1">Todo lo que necesitas, a un clic.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {acciones.map(a => (
            <Link key={a.to} to={a.to} className="card-interactive p-6 group flex flex-col gap-4">
              <span className={`w-11 h-11 rounded-2xl ${a.tone} text-white flex items-center justify-center shadow-lg shadow-slate-900/10`} aria-hidden="true">
                <a.Icon className="w-5 h-5" />
              </span>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-base block">{a.title}</span>
                <span className="text-sm text-slate-500 leading-relaxed block">{a.text}</span>
              </div>
              <span className="mt-auto pt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange-600 group-hover:translate-x-1 transition-transform" aria-hidden="true">
                Ir <IconArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Principios */}
      <section aria-labelledby="principios" className="space-y-5">
        <div>
          <h2 id="principios" className="text-2xl font-bold tracking-tight text-slate-900">Por qué IncluTrabajo</h2>
          <p className="text-sm text-slate-500 mt-1">Diseño universal, transparencia algorítmica y ajustes reales.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="card p-6 space-y-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ring-1 ${f.tone}`} aria-hidden="true">
                <f.Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
