import React from 'react';
import { useDictation } from '../hooks/useSpeech';
import { IconMic } from './Icons';

/**
 * Botón de micrófono reutilizable para dictar el contenido de un campo.
 * El texto reconocido se entrega mediante `onTranscript`.
 */
export default function DictationButton({ onTranscript, label = 'Dictar con voz', compact = false }) {
  const { listening, supported, error, toggle } = useDictation({
    lang: 'es-CO',
    onResult: onTranscript,
  });

  if (!supported) {
    return null;
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        aria-label={listening ? `Detener dictado: ${label}` : label}
        title={listening ? 'Detener dictado' : label}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition focus-visible:ring-4 focus-visible:ring-orange-300 min-h-[44px] ${
          compact ? 'px-3 text-sm' : 'px-3.5 text-sm'
        } ${
          listening
            ? 'bg-orange-600 border-orange-500 text-white animate-pulse'
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
        }`}
      >
        <IconMic className="w-4 h-4" />
        <span className={compact ? 'sr-only' : ''}>{listening ? 'Escuchando…' : 'Dictar'}</span>
      </button>
      {listening && (
        <span role="status" className="sr-only">Escuchando. Habla ahora.</span>
      )}
      {error && (
        <span role="alert" className="text-xs text-red-700 mt-1 max-w-[220px]">{error}</span>
      )}
    </span>
  );
}
