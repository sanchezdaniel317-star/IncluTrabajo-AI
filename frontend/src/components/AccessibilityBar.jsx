import React from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { IconContrast, IconPause, IconSpeaker } from './Icons';

const seg = (active) =>
  `px-3 py-1.5 text-xs font-bold min-h-[34px] min-w-[36px] rounded-full transition focus:z-10 focus-visible:ring-2 focus-visible:ring-violet-400 ${
    active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-900/5'
  }`;

const toggle = (active) =>
  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border min-h-[34px] transition focus-visible:ring-4 focus-visible:ring-violet-200 ${
    active
      ? 'bg-slate-900 text-white border-slate-900'
      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
  }`;

export default function AccessibilityBar() {
  const {
    fontSize, increaseFont, decreaseFont, resetFont,
    toggleContrast, highContrast,
    toggleMotion, reduceMotion,
    isSpeaking, speakText, stopSpeaking
  } = useAccessibility();
  const zoom = Math.round(fontSize * 100);

  const handleReadPage = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const mainText = document.getElementById('main-content')?.innerText || document.body.innerText;
      speakText(mainText);
    }
  };

  return (
    <aside aria-label="Barra de accesibilidad" className="bg-white/75 backdrop-blur border-b border-slate-900/10 py-2 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accesibilidad</span>
          <div className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-0.5 shadow-sm" role="group" aria-label="Tamaño de letra">
            <button onClick={decreaseFont} className={seg(fontSize < 1)} title="Reducir tamaño de letra" aria-label={`Reducir tamaño de letra (actual ${zoom}%)`} aria-pressed={fontSize < 1}>A−</button>
            <button onClick={resetFont} className={seg(fontSize === 1)} title="Restablecer tamaño de letra" aria-label={`Restablecer tamaño de letra (actual ${zoom}%)`} aria-pressed={fontSize === 1}>Normal</button>
            <button onClick={increaseFont} className={seg(fontSize > 1)} title="Aumentar tamaño de letra" aria-label={`Aumentar tamaño de letra (actual ${zoom}%)`} aria-pressed={fontSize > 1}>A+</button>
          </div>
          <span className="text-xs font-semibold text-slate-400 tabular-nums" aria-live="polite">{zoom}%</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={toggleContrast} className={toggle(highContrast)} aria-pressed={highContrast}>
            <IconContrast className="w-3.5 h-3.5" />
            {highContrast ? 'Contraste alto' : 'Alto contraste'}
          </button>

          <button onClick={toggleMotion} className={toggle(reduceMotion)} aria-pressed={reduceMotion}>
            <IconPause className="w-3.5 h-3.5" />
            {reduceMotion ? 'Movimiento reducido' : 'Reducir movimiento'}
          </button>

          <button
            onClick={handleReadPage}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold min-h-[34px] transition focus-visible:ring-4 focus-visible:ring-violet-200 ${
              isSpeaking
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/25 hover:from-violet-500 hover:to-indigo-500'
            }`}
            aria-pressed={isSpeaking}
          >
            <IconSpeaker className="w-3.5 h-3.5" />
            {isSpeaking ? 'Detener lectura' : 'Leer página'}
          </button>
        </div>
      </div>
    </aside>
  );
}
