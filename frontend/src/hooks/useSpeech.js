import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Dictado por voz usando la Web Speech API del navegador (ASR).
 * No envía audio a la aplicación: el reconocimiento ocurre en el navegador.
 */
export function useDictation({ lang = 'es-CO', onResult } = {}) {
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SpeechRecognition) {
      setSupported(false);
      return undefined;
    }

    setSupported(true);
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) {
        onResultRef.current?.(transcript);
      }
    };

    recognition.onerror = (event) => {
      const mensajes = {
        'not-allowed': 'No se concedió permiso para usar el micrófono.',
        'no-speech': 'No se detectó voz. Intenta de nuevo acercándote al micrófono.',
        'audio-capture': 'No se encontró un micrófono disponible.',
        network: 'El reconocimiento de voz necesita conexión a internet.',
      };
      setError(mensajes[event.error] || 'No se pudo completar el dictado.');
      setListening(false);
    };

    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // El reconocimiento ya estaba detenido.
      }
      recognitionRef.current = null;
    };
  }, [lang]);

  const toggle = useCallback(() => {
    setError('');
    const recognition = recognitionRef.current;
    if (!recognition) {
      setError('Tu navegador no soporta dictado por voz. Puedes escribir normalmente.');
      return;
    }
    if (listening) {
      recognition.stop();
      setListening(false);
      return;
    }
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError('No se pudo iniciar el micrófono. Revisa los permisos del navegador.');
      setListening(false);
    }
  }, [listening]);

  return { listening, supported, error, toggle, clearError: () => setError('') };
}
