import React from 'react';
import { Link } from 'react-router-dom';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useSession } from '../contexts/SessionContext';
import { useRouteA11y } from '../hooks/useRouteA11y';
import { IconSpeaker, IconCheck, IconMic } from '../components/Icons';

const pasosCandidato = [
  'Crea una cuenta o inicia sesión con correo y contraseña, o usa una cuenta demo.',
  'Completa tu perfil: ciudad, experiencia, aspiración salarial, competencias, necesidades de accesibilidad y su prioridad.',
  'Autoriza (o no) compartir tus ajustes con las empresas desde tu perfil.',
  'Abre “Emparejamiento IA” para revisar las vacantes ordenadas por compatibilidad y entender las razones.',
  'Explora el catálogo “Vacantes” si prefieres buscar por ciudad, modalidad, jornada o ajuste.',
  'Revisa el detalle, el checklist de accesibilidad (declarado o verificado) y postúlate.',
  'Sigue el estado, la retroalimentación y las notificaciones en “Mis Postulaciones”.'
];

const pasosEmpresa = [
  'Crea una cuenta de empresa o inicia sesión con una cuenta demo.',
  'Entra al “Panel Empresa” para ver tus publicaciones, postulantes y estados.',
  'Publica una vacante especificando competencias y checklist de accesibilidad real.',
  'Edita, cierra o reabre la vacante desde el panel cuando lo necesites.',
  'Abre “Ver candidatos” para revisar el ranking explicable y actualizar el estado del proceso.',
  'La persona candidata recibe una notificación interna y puede ver tu retroalimentación.'
];

export default function Help() {
  useRouteA11y('Ayuda y Accesibilidad');
  const { speakText, stopSpeaking, isSpeaking, highContrast, toggleContrast, reduceMotion, toggleMotion } = useAccessibility();
  const { session } = useSession();

  const leerAyuda = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    const contenido = document.getElementById('contenido-ayuda')?.innerText || '';
    speakText(contenido);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" id="contenido-ayuda">
      <header className="page-header">
        <div>
          <span className="eyebrow">Guía de uso y accesibilidad</span>
          <h1 className="page-title mt-1" tabIndex={-1}>Ayuda y accesibilidad</h1>
          <p className="page-subtitle">
            IncluTrabajo AI está diseñada para usarse cómodamente con teclado, lector de pantalla, voz y diferentes niveles de visión.
          </p>
        </div>
        <button
          type="button"
          onClick={leerAyuda}
          className="btn-teal"
          aria-pressed={isSpeaking}
        >
          <IconSpeaker className="w-4 h-4" /> {isSpeaking ? 'Detener lectura' : 'Escuchar esta ayuda'}
        </button>
      </header>

      <section aria-labelledby="acc-rapida" className="card p-6 md:p-8 space-y-4">
        <h2 id="acc-rapida" className="text-2xl font-bold text-brand-900">Ajustes rápidos de accesibilidad</h2>
        <p className="text-slate-600 text-sm">
          La barra superior de accesibilidad se encuentra disponible en todas las pantallas. Tus preferencias se guardan de forma persistente en este navegador.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="font-bold text-slate-900">Tamaño de fuente</p>
            <p className="text-sm text-slate-600">Usa los botones <strong>A−</strong>, <strong>Normal</strong> y <strong>A+</strong> para escalar el texto globalmente.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="font-bold text-slate-900">Alto contraste</p>
            <p className="text-sm text-slate-600">Optimiza colores para baja visión o alta visibilidad solar.</p>
            <button
              type="button"
              onClick={toggleContrast}
              aria-pressed={highContrast}
              className="text-sm font-semibold text-teal-800 underline hover:text-teal-600 focus-visible:ring-2 focus-visible:ring-orange-400 rounded"
            >
              {highContrast ? 'Desactivar alto contraste' : 'Activar alto contraste'}
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <p className="font-bold text-slate-900">Movimiento reducido</p>
            <p className="text-sm text-slate-600">Desactiva animaciones y transiciones visuales.</p>
            <button
              type="button"
              onClick={toggleMotion}
              aria-pressed={reduceMotion}
              className="text-sm font-semibold text-teal-800 underline hover:text-teal-600 focus-visible:ring-2 focus-visible:ring-orange-400 rounded"
            >
              {reduceMotion ? 'Desactivar movimiento reducido' : 'Activar movimiento reducido'}
            </button>
          </div>
        </div>
      </section>

      <section aria-labelledby="teclado" className="card p-6 md:p-8 space-y-4">
        <h2 id="teclado" className="text-2xl font-bold text-brand-900">Navegación completa por teclado</h2>
        <ul className="space-y-2 text-slate-700 text-sm leading-relaxed">
          <li className="flex items-start gap-2">
            <IconCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>Usa <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Tab</kbd> para avanzar y <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Shift + Tab</kbd> para retroceder entre controles interactivos.</span>
          </li>
          <li className="flex items-start gap-2">
            <IconCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>Usa <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Enter</kbd> o <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Espacio</kbd> para activar botones, enlaces y opciones.</span>
          </li>
          <li className="flex items-start gap-2">
            <IconCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>El primer elemento accesible de cada página es el enlace <strong>“Saltar al contenido principal”</strong>.</span>
          </li>
          <li className="flex items-start gap-2">
            <IconCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>El foco activo se resalta siempre con un contorno violeta de alto contraste.</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="voz" className="card p-6 md:p-8 space-y-4">
        <h2 id="voz" className="text-2xl font-bold text-brand-900">Voz y dictado asistido</h2>
        <p className="text-slate-700 text-sm leading-relaxed">
          Puedes escuchar cualquier pantalla usando el botón <strong>“Leer página”</strong>. La lectura se detiene al cambiar de sección. En el detalle de las vacantes dispones de <strong>“Escuchar vacante”</strong>.
          Además, en los formularios de perfil y vacantes cuentas con botones de micrófono <IconMic className="w-4 h-4 inline align-text-bottom" /> para dictar texto en navegadores compatibles (Chrome y Edge).
        </p>
      </section>

      <section aria-labelledby="pasos" className="card p-6 md:p-8 space-y-4">
        <h2 id="pasos" className="text-2xl font-bold text-brand-900">Flujos de uso</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-bold text-teal-800 text-base">Para buscadores de empleo</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 leading-relaxed">
              {pasosCandidato.map((paso) => <li key={paso}>{paso}</li>)}
            </ol>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-brand-900 text-base">Para empresas clientes</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 leading-relaxed">
              {pasosEmpresa.map((paso) => <li key={paso}>{paso}</li>)}
            </ol>
          </div>
        </div>
      </section>

      <div className="pt-2">
        <Link to={session.perfil ? '/inicio' : '/login'} className="btn-primary btn-lg">
          {session.perfil ? 'Volver al inicio' : 'Iniciar sesión o crear cuenta'}
        </Link>
      </div>
    </div>
  );
}
