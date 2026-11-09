import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const { pathname } = useLocation();
  const [fontSize, setFontSize] = useState(() => {
    return parseFloat(localStorage.getItem('a11y_font_size') || '1');
  });
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('a11y_contrast') === 'high';
  });
  const [reduceMotion, setReduceMotion] = useState(() => {
    return localStorage.getItem('a11y_motion') === 'reduced';
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize * 16}px`;
    localStorage.setItem('a11y_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [pathname]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
      localStorage.setItem('a11y_contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
      localStorage.setItem('a11y_contrast', 'normal');
    }
  }, [highContrast]);

  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.setAttribute('data-motion', 'reduced');
      localStorage.setItem('a11y_motion', 'reduced');
    } else {
      document.documentElement.removeAttribute('data-motion');
      localStorage.setItem('a11y_motion', 'normal');
    }
  }, [reduceMotion]);

  const increaseFont = () => setFontSize(prev => Math.min(Number((prev + 0.1).toFixed(2)), 2));
  const decreaseFont = () => setFontSize(prev => Math.max(Number((prev - 0.1).toFixed(2)), 0.9));
  const resetFont = () => setFontSize(1);
  const toggleContrast = () => setHighContrast(prev => !prev);
  const toggleMotion = () => setReduceMotion(prev => !prev);

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      setAnnouncement('Tu navegador no soporta síntesis de voz. Puedes leer el contenido en pantalla.');
      return;
    }
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CO';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const announce = (message) => {
    setAnnouncement('');
    setTimeout(() => setAnnouncement(message), 100);
  };

  return (
    <AccessibilityContext.Provider value={{
      fontSize, increaseFont, decreaseFont, resetFont,
      highContrast, toggleContrast,
      reduceMotion, toggleMotion,
      isSpeaking, speakText, stopSpeaking,
      announcement, announce
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
