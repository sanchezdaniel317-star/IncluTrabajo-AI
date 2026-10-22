import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessibility } from '../contexts/AccessibilityContext';

export function useRouteA11y(pageTitle) {
  const location = useLocation();
  const { announce } = useAccessibility();

  useEffect(() => {
    document.title = `${pageTitle} — IncluTrabajo AI`;
    announce(`Estás en la página: ${pageTitle}`);
    
    // Enfocar el primer título h1 si existe
    const h1 = document.querySelector('h1');
    if (h1) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: false });
    }
  }, [location.pathname]);
}
