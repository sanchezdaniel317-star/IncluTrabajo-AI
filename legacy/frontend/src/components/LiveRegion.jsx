import React from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';

export default function LiveRegion() {
  const { announcement } = useAccessibility();

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );
}
