# Checklist de accesibilidad — IncluTrabajo AI

Fecha de la revisión: 2026-10-21.

## Comprobaciones automatizadas incluidas

- [x] Pruebas E2E de login, registro, flujos candidato/empresa, catálogo y móvil.
- [x] Zoom propio hasta 200 % y restablecimiento.
- [x] Activación/desactivación del alto contraste.
- [x] Sin desbordamiento horizontal a 390 px en login, registro y catálogo.
- [x] Sin errores de consola en los recorridos automatizados (se excluyen los 401 intencionales del login inválido).

Ejecutar:

```powershell
cd frontend
npm run build
cd ..
python -m pytest
```

## Comprobaciones manuales recomendadas

### Teclado

- [ ] El primer `Tab` muestra “Saltar al contenido principal”.
- [ ] Se puede recorrer toda la página sin ratón.
- [ ] El foco siempre es visible sobre fondos claros, oscuros y botones de color.
- [ ] Los diálogos nativos de confirmación se pueden cancelar con `Esc`.
- [ ] Los formularios se envían con `Enter`.

### Lector de pantalla (NVDA o Narrador)

- [ ] El cambio de ruta se anuncia.
- [ ] Los títulos tienen una jerarquía lógica (un `h1` por página).
- [ ] Los errores se leen al aparecer (`role="alert"`).
- [ ] Los estados de guardado se leen (`role="status"`).
- [ ] Las tarjetas de accesibilidad anuncian si están verificadas o declaradas.
- [ ] El botón de notificaciones anuncia el número de avisos sin leer.

### Visión y contraste

- [ ] Texto normal ≥ 4.5:1 y texto grande ≥ 3:1.
- [ ] Los textos pequeños (`text-[10px]`, `text-[11px]`) usan tokens oscurecidos.
- [ ] El modo alto contraste mantiene todos los textos legibles y elimina degradados.
- [ ] El foco amarillo del alto contraste es visible.
- [ ] A 200 % de zoom no se pierde contenido ni aparecen scrolls horizontales.
- [ ] A 320 px de ancho la navegación y los formularios se reflotan.

### Voz

- [ ] “Leer página” funciona en Chrome/Edge.
- [ ] La lectura se detiene al cambiar de ruta.
- [ ] “Escuchar vacante” lee el detalle.
- [ ] El dictado inserta texto en los campos compatibles.
- [ ] Si el navegador no soporta TTS, se muestra un mensaje en la región de anuncios (no un `alert`).

### Formularios

- [ ] Los campos obligatorios se identifican.
- [ ] Los errores se asocian con `aria-invalid`/`aria-describedby` cuando aplica.
- [ ] El foco permanece en un lugar predecible después de guardar.
- [ ] El consentimiento de accesibilidad es explícito y revocable.
- [ ] El teléfono se marca como privado y no se muestra a empresas.

## Riesgos y pendientes

- [ ] Auditoría formal con axe DevTools o Lighthouse.
- [ ] Prueba con NVDA y Narrador en una sesión completa.
- [ ] Verificar la lectura de los gráficos de score con lectores de pantalla.
- [ ] Revisar el comportamiento en dispositivos físicos iOS/Android.
- [ ] Validar el contraste de todos los tokens tras futuros cambios de diseño.

## Nota sobre el alto contraste

El modo de alto contraste fuerza fondos negros, texto blanco, enlaces amarillos y elimina `background-image` para evitar que los degradados oculten texto. Si se añaden imágenes o gráficos nuevos, deben probarse también en este modo.
