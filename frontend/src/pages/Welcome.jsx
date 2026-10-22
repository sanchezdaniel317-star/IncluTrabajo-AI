import React from 'react';
import { Link } from 'react-router-dom';
import { useRouteA11y } from '../hooks/useRouteA11y';
import {
  IconUser, IconBuilding, IconRobot, IconAccessibility, IconShield,
  IconCheck, IconArrowRight, IconSparkles, IconBriefcase
} from '../components/Icons';

const pasos = [
  {
    n: '01',
    title: 'Crea tu perfil',
    text: 'Registra tus competencias y tus necesidades de accesibilidad. Sin etiquetas, sin sesgos.',
    Icon: IconUser,
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  {
    n: '02',
    title: 'La IA empareja',
    text: 'Comparamos competencias reales con las condiciones del puesto y explicamos cada coincidencia.',
    Icon: IconRobot,
    tone: 'bg-violet-50 text-violet-700 ring-violet-200',
  },
  {
    n: '03',
    title: 'Postula con confianza',
    text: 'Consulta los ajustes razonables de cada vacante y sigue el estado de tu postulación.',
    Icon: IconBriefcase,
    tone: 'bg-slate-100 text-slate-700 ring-slate-300',
  },
];

const paraPersonas = [
  'Perfil accesible con tus necesidades reales',
  'Coincidencias explicadas paso a paso',
  'Todas tus postulaciones en un solo lugar',
];

const paraEmpresas = [
  'Vacantes con checklist de accesibilidad',
  'Talento ordenado por compatibilidad',
  'Ajustes razonables visibles y verificables',
];

export default function Welcome() {
  useRouteA11y('Bienvenida');

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-white ring-1 ring-slate-900/10 shadow-soft p-8 md:p-12 lg:p-16">
        <div className="absolute -top-40 -right-24 w-[30rem] h-[30rem] rounded-full bg-violet-300/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-24 w-[26rem] h-[26rem] rounded-full bg-emerald-300/25 blur-3xl" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden="true" />

        <div className="relative grid lg:grid-cols-[1.05fr_0.95fr] items-center gap-12">
          <div className="space-y-6 animate-fade-up">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 text-balance leading-[1.05]" tabIndex={-1}>
              Tu talento, <br className="hidden sm:block" />
              <span className="text-gradient">sin barreras</span>.
            </h1>

            <p className="text-lg md:text-xl text-slate-500 max-w-xl text-balance leading-relaxed">
              Conectamos competencias reales con puestos realmente accesibles.
              Emparejamiento con IA explicable, ajustes razonables y diseño universal.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link to="/registro" className="btn-primary btn-lg">
                Crear cuenta gratis
                <IconArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link to="/login" className="btn-secondary btn-lg">
                Iniciar sesión
              </Link>
              <a href="#como-funciona" className="text-sm font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-4 rounded px-1">
                Cómo funciona
              </a>
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-3 text-sm font-medium text-slate-600">
              {[
                { Icon: IconSparkles, text: 'IA explicable' },
                { Icon: IconAccessibility, text: 'WCAG 2.2' },
                { Icon: IconShield, text: 'Sin sesgos demográficos' },
              ].map(({ Icon, text }) => (
                <li key={text} className="inline-flex items-center gap-2">
                  <Icon className="w-4 h-4 text-violet-600" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Vista previa */}
          <div className="relative max-w-md w-full mx-auto lg:ml-auto animate-fade-up">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-violet-500/15 via-transparent to-emerald-500/15 blur-2xl" aria-hidden="true" />

            <div className="relative bg-white rounded-3xl ring-1 ring-slate-900/10 shadow-lift p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-700 text-white text-xs font-extrabold flex items-center justify-center shadow-lg shadow-indigo-600/25" aria-hidden="true">
                    TI
                  </span>
                  <div className="leading-tight min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold truncate">TechIncluye S.A.S.</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">Remoto · Tiempo completo</p>
                  </div>
                </div>
                <div className="shrink-0 text-center rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 leading-none">
                  <span className="block text-base font-extrabold text-emerald-700">92%</span>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-emerald-600 mt-0.5">Match</span>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-slate-900 leading-snug">Analista de datos con ajustes de accesibilidad</h2>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Buscamos talento en análisis de datos. Ajustes y herramientas de apoyo disponibles desde el día uno.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="badge-access">Teletrabajo</span>
                <span className="badge-access">Horario flexible</span>
                <span className="badge-neutral">Lengua de señas</span>
              </div>

              <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-3.5 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">Por qué coincides</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tus competencias en SQL y visualización cubren el 92% del perfil; el puesto ofrece los ajustes que necesitas.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  Declarada por la empresa
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600" aria-hidden="true">
                  Ver detalle <IconArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" aria-labelledby="como-funciona-title" className="space-y-6 scroll-mt-24">
        <div className="max-w-2xl space-y-2">
          <p className="eyebrow">Cómo funciona</p>
          <h2 id="como-funciona-title" className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Tres pasos hacia un empleo inclusivo
          </h2>
          <p className="text-slate-500">Un proceso claro, sin cajas negras y con la accesibilidad en el centro.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {pasos.map(({ n, title, text, Icon, tone }) => (
            <div key={n} className="card p-6 space-y-4 relative overflow-hidden">
              <span className="absolute top-5 right-6 text-4xl font-extrabold text-slate-900/5" aria-hidden="true">{n}</span>
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ring-1 ${tone}`} aria-hidden="true">
                <Icon className="w-5 h-5" />
              </span>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Para quién */}
      <section aria-labelledby="para-quien" className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <p className="eyebrow">Dos lados, un mismo objetivo</p>
          <h2 id="para-quien" className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Una plataforma para personas y empresas
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-7 md:p-8 space-y-5">
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 flex items-center justify-center" aria-hidden="true">
                <IconUser className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Busco empleo</h3>
                <p className="text-sm text-slate-500 mt-0.5">Encuentra puestos compatibles con tu talento y tus necesidades.</p>
              </div>
            </div>
            <ul className="space-y-2.5">
              {paraPersonas.map(t => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                    <IconCheck className="w-3 h-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/login" className="btn-teal w-full sm:w-auto">
              Entrar como candidato
            </Link>
          </div>

          <div className="card p-7 md:p-8 space-y-5">
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-200 flex items-center justify-center" aria-hidden="true">
                <IconBuilding className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Soy empresa</h3>
                <p className="text-sm text-slate-500 mt-0.5">Publica vacantes inclusivas y conecta con talento diverso.</p>
              </div>
            </div>
            <ul className="space-y-2.5">
              {paraEmpresas.map(t => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                    <IconCheck className="w-3 h-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/login" className="btn-navy w-full sm:w-auto">
              Entrar como empresa
            </Link>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white p-8 md:p-14">
        <div className="absolute -top-24 right-10 w-[26rem] h-[26rem] rounded-full bg-violet-600/25 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-28 left-0 w-[22rem] h-[22rem] rounded-full bg-emerald-500/15 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-300">Empieza hoy</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-balance">
              La inclusión laboral se construye con oportunidades reales.
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Explora la plataforma con una cuenta de demostración y descubre cómo se siente un proceso de selección accesible.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link to="/registro" className="btn-primary btn-lg">Crear cuenta</Link>
            <Link to="/login" className="btn-ghost-light btn-lg">Iniciar sesión</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
