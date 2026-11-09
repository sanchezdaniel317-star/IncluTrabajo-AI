---
name: IncluTrabajo IA
description: Vinculación laboral de personas con discapacidad con accesibilidad del puesto verificada y coincidencias explicadas.
colors:
  suelo: "#fce9dd"
  suelo-2: "#f6d9c7"
  suelo-3: "#f0cdb8"
  tarjeta: "#ffffff"
  tinta: "#1b1b1f"
  tinta-2: "#55555e"
  filete: "#efd3c2"
  control: "#85838c"
  accion: "#096a50"
  accion-hover: "#075540"
  accion-presion: "#054634"
  accion-suave: "#dcefe7"
  verificado: "#1f4fbf"
  verificado-suave: "#e4ebfb"
  ajustable: "#855600"
  ajustable-suave: "#fbefd3"
  falta: "#b3261e"
  falta-suave: "#fbe4e1"
  contraste-fondo: "#000000"
  contraste-accion: "#ffe500"
typography:
  display:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(3rem, 1.6rem + 5.6vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(2.25rem, 1.4rem + 3vw, 4rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  page-title:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 2.6vw, 3.25rem)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  body-legible:
    fontFamily: "Atkinson Hyperlegible Next Variable, Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  lead-grande:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1.6
  lead:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 800
    lineHeight: 1.2
  help:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  chip:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 800
    lineHeight: 1.3
  nav-bar-label:
    fontFamily: "Figtree Variable, Figtree, ui-sans-serif, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.15
rounded:
  control: "1rem"
  tarjeta: "1.75rem"
  grande: "2.25rem"
  pildora: "999px"
  foco: "0.5rem"
  barra-item: "1.25rem"
spacing:
  contenedor-max: "76rem"
  contenedor-borde: "1rem"
  contenedor-borde-md: "2rem"
  tarjeta-relleno: "1.5rem"
  tarjeta-relleno-md: "2rem"
  seccion: "5rem"
  seccion-md: "7rem"
  control-alto: "3.25rem"
components:
  button-accion:
    backgroundColor: "{colors.accion}"
    textColor: "{colors.tarjeta}"
    typography: "{typography.label}"
    rounded: "{rounded.pildora}"
    padding: "0.8rem 1.5rem"
    height: "3.25rem"
  button-accion-hover:
    backgroundColor: "{colors.accion-hover}"
  button-accion-active:
    backgroundColor: "{colors.accion-presion}"
  button-claro:
    backgroundColor: "{colors.tarjeta}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pildora}"
    padding: "0.8rem 1.5rem"
    height: "3.25rem"
  button-claro-hover:
    backgroundColor: "{colors.suelo}"
  button-suave:
    backgroundColor: "{colors.suelo-2}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pildora}"
    padding: "0.8rem 1.5rem"
    height: "3.25rem"
  button-peligro:
    backgroundColor: "{colors.tarjeta}"
    textColor: "{colors.falta}"
    rounded: "{rounded.pildora}"
    padding: "0.8rem 1.5rem"
    height: "3.25rem"
  button-peligro-hover:
    backgroundColor: "{colors.falta-suave}"
  button-grande:
    height: "3.75rem"
    padding: "0.8rem 2rem"
  button-disabled:
    backgroundColor: "{colors.suelo-2}"
    textColor: "{colors.tinta-2}"
  tarjeta:
    backgroundColor: "{colors.tarjeta}"
    rounded: "{rounded.tarjeta}"
    padding: "1.5rem"
  tarjeta-grande:
    backgroundColor: "{colors.tarjeta}"
    rounded: "{rounded.grande}"
    padding: "2rem"
  entrada:
    backgroundColor: "{colors.tarjeta}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1rem"
    height: "3.25rem"
  opcion:
    backgroundColor: "{colors.tarjeta}"
    rounded: "{rounded.control}"
    padding: "0.7rem 1rem"
    height: "3.25rem"
  opcion-marcada:
    backgroundColor: "{colors.accion-suave}"
  segmento:
    backgroundColor: "{colors.tarjeta}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pildora}"
    padding: "0.5rem 1.05rem"
    height: "2.9rem"
  segmento-marcado:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.tarjeta}"
  estado-verificado:
    backgroundColor: "{colors.verificado-suave}"
    textColor: "{colors.verificado}"
    rounded: "{rounded.pildora}"
    padding: "0.3rem 0.75rem"
  estado-declarado:
    backgroundColor: "{colors.tarjeta}"
    textColor: "{colors.tinta-2}"
    rounded: "{rounded.pildora}"
    padding: "0.3rem 0.75rem"
  estado-ajustable:
    backgroundColor: "{colors.ajustable-suave}"
    textColor: "{colors.ajustable}"
    rounded: "{rounded.pildora}"
    padding: "0.3rem 0.75rem"
  estado-falta:
    backgroundColor: "{colors.falta-suave}"
    textColor: "{colors.falta}"
    rounded: "{rounded.pildora}"
    padding: "0.3rem 0.75rem"
  estado-neutro:
    backgroundColor: "{colors.suelo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pildora}"
    padding: "0.3rem 0.75rem"
  marca-coincidencia:
    backgroundColor: "{colors.suelo-2}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.pildora}"
    size: "2.25rem"
  nav-enlace:
    textColor: "{colors.tinta}"
    rounded: "{rounded.pildora}"
    padding: "0.45rem 1rem"
    height: "2.9rem"
  nav-enlace-actual:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.tarjeta}"
  barra-inferior:
    backgroundColor: "{colors.tarjeta}"
    rounded: "{rounded.tarjeta}"
    padding: "0.375rem"
  aviso-flash:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.tarjeta}"
    rounded: "{rounded.control}"
    padding: "1rem 1.25rem"
---

# Design System: IncluTrabajo IA

## Overview

**Creative North Star: "La app de confianza"**

IncluTrabajo IA se ve y se toca como las apps de consumo que la gente ya usa a diario y en las que confía: un suelo durazno cálido, tarjetas blancas muy redondeadas que flotan con una sombra suave, tinta casi negra y palabras de persona. La densidad es baja a propósito: texto base de 18 px, controles de al menos 52 px de alto, una idea por tarjeta. La misma visual world sirve a la portada (persuadir) y a las pantallas de persona y empresa (operar); lo que cambia es la escala del titular, no el material.

El color se gana. Solo hay un color fuerte y es el verde de acción: si algo es verde, se puede tocar. Los estados de accesibilidad del puesto tienen su propio vocabulario (sello azul, contorno punteado, reloj ámbar, equis ladrillo) y nunca se confunden con la acción. Todo estado se dice también con ícono y palabra, nunca solo con color.

La accesibilidad es parte del sistema, no una capa encima: tamaño de texto, contraste, letra de lectura, espaciado y movimiento se eligen en la página y cambian los tokens desde la raíz. El sistema rechaza la bolsa de empleo de tarjetitas grises y el héroe de plantilla con degradado violeta.

**Key Characteristics:**
- Suelo durazno, tarjetas blancas de 28–36 px de radio, botones en píldora.
- Un único verde de acción, reservado a lo accionable.
- Cuatro estados de ajuste con color, ícono y texto propios, ajenos al verde.
- Figtree en todo; Atkinson Hyperlegible Next como letra de lectura elegible.
- Íconos de línea propios en retícula de 24 px, trazo 2,4 con puntas redondas.
- Presión con resorte suave; un solo gesto con scroll en la portada, apagable.
- Cinco modos de preferencia en `html[data-*]`, más `prefers-contrast` y `forced-colors`.

## Colors

Una paleta cálida y casi monocroma (durazno, blanco, tinta) con un solo acento accionable y una familia aparte para los estados del puesto.

### Primary
- **Verde Caribe de acción** (`accion`): fondo de botones principales (`btn-accion`), de la puerta «Busco empleo», enlaces de texto (`enlace`), destino actual de la barra inferior, casillas (`accent-color`) y cursor de escritura. Se oscurece al pasar (`accion-hover`) y al presionar (`accion-presion`). Su versión suave (`accion-suave`) marca la opción elegida en una `opcion` y la selección de texto.

### Secondary
- **Sello azul verificado** (`verificado`, `verificado-suave`): ajuste verificado en sitio por el equipo técnico. Siempre con el ícono de sello y la palabra.
- **Ámbar ajustable** (`ajustable`, `ajustable-suave`): ajuste que la empresa se compromete a tener en una fecha. Siempre con el ícono de reloj y la fecha.
- **Ladrillo falta** (`falta`, `falta-suave`): ajuste o requisito que falta, errores de formulario, acción destructiva (`btn-peligro`). Siempre con equis o alerta y texto.

### Neutral
- **Suelo durazno** (`suelo`): fondo de página; también fondo de las filas de coincidencia y de las cifras dentro de tarjetas.
- **Durazno hondo** (`suelo-2`): bandas de sección alternas, botón suave, pista del anillo de puntaje, marcas de fila de coincidencia, botón deshabilitado.
- **Durazno tostado** (`suelo-3`): solo el hover del botón suave.
- **Blanco tarjeta** (`tarjeta`): tarjetas, campos, opciones, barra inferior.
- **Tinta** (`tinta`): texto, titulares, anillo de focus, arco del anillo de puntaje, segmento elegido, enlace de navegación actual, aviso flash.
- **Gris cálido** (`tinta-2`): texto secundario, ayudas, etiquetas inactivas de la barra inferior.
- **Filete** (`filete`): borde de reposo de la `opcion` y línea superior del pie.
- **Alto contraste** (`contraste-fondo` #000, `contraste-accion` #ffe500): solo bajo `data-contraste="alto"`; fondo negro y acción amarilla con texto negro.
- **Gris de control** (`control`): borde de campos y segmentos, contorno punteado de «declarado».

### Named Rules
**The Verde Que Se Toca Rule.** El verde de acción aparece solo en lo que se puede tocar o activar. Un número, un estado, un ícono decorativo o un fondo que no responde nunca es verde.

**The Estado No Es Acción Rule.** Verificado es azul con sello, declarado es contorno punteado gris sobre blanco, ajustable es ámbar con reloj, falta es ladrillo con equis. Ninguno usa el verde de acción, y cada uno lleva su ícono y su palabra.

**The Fila En Tinta Rule.** En las filas de coincidencia, las marcas de sí y en parte usan tinta sobre `suelo-2`; solo «falta» va en ladrillo. Las filas de ajustes usan su estado real (verificado, declarado, ajustable). Una coincidencia no se pinta de verde para parecer buena.

**The Alto Contraste Rule.** En `data-contraste="alto"` todo el sistema pasa a negro y blanco y la acción pasa a amarillo `#ffe500` con texto negro; los estados toman versiones claras sobre fondos muy oscuros. Se cambia en los tokens, no componente por componente.

## Typography

**Display Font:** Figtree Variable (con ui-sans-serif, system-ui, Segoe UI, Roboto)
**Body Font:** Figtree Variable; Atkinson Hyperlegible Next Variable cuando la persona elige «Alta legibilidad» (`html[data-letra="legible"]`)
**Label Font:** Figtree Variable

**Character:** Figtree da la voz redonda y amable de app de consumo, en pesos muy altos (800–900) para titulares; Atkinson Hyperlegible Next es la letra de lectura que la persona activa cuando la necesita, sin que el diseño se rompa.

### Hierarchy
- **Display** (900, `clamp(3rem, 1.6rem + 5.6vw, 6rem)`, 0.95, −0.04em): solo el titular de la portada.
- **Headline** (800, `clamp(2.25rem, 1.4rem + 3vw, 4rem)`, 1): titulares de sección de la portada; el cierre sube a `clamp(2.5rem, 1.5rem + 3.6vw, 4.75rem)`.
- **Page title** (800, `clamp(2rem, 1.4rem + 2.6vw, 3.25rem)`, 1.12): titular de cada pantalla interna (`titulo-pagina`), con `subtitulo` en gris cálido a 1.1875rem.
- **Title** (800, 1.5–1.875rem, 1.12): títulos de tarjeta y de vacante.
- **Body** (400, 1.125rem, 1.6): texto corrido; descripciones largas se limitan a 65–70ch.
- **Lead grande** (400, 1.375rem, 1.6): bajada del titular de la portada; también la marca desde 640px.
- **Lead** (400, 1.1875rem, 1.6): `subtitulo` de pantallas internas, texto de `btn-grande` y la marca en celular.
- **Label** (800, 1.0625rem): etiquetas de campo y texto de botón. Ayuda en 1rem, gris cálido.
- **Chip** (800, 0.9375rem, 1.3): chips de estado (`estado-*`).
- **Barra inferior** (700, 0.8125rem, 1.15): etiquetas bajo los íconos.

Los titulares usan `text-wrap: balance`; párrafos y listas, `text-wrap: pretty`. Las cifras usan números tabulares (`num`).

### Named Rules
**The Tamaño En Rem Rule.** Todo tamaño de texto y todo umbral de diseño está en rem, para que `data-texto="grande"` (118,75 %) y `"enorme"` (137,5 %) escalen la página entera sin cortes.

**The Sin Mayúsculas Rule.** No hay texto en mayúsculas sostenidas ni con interletrado abierto. Las etiquetas se escriben en tipo de frase.

## Layout

Un contenedor centrado de 76rem con borde lateral de 1rem en celular y 2rem desde 48rem. La regla base `.grid { grid-template-columns: minmax(0, 1fr) }` asegura que ninguna columna crezca más que la pantalla; las utilidades de columnas la reemplazan en pantallas anchas. La portada alterna bandas `suelo` y `suelo-2` con 5rem de aire vertical (7rem desde md); la primera pantalla pone texto y puertas a la izquierda y una tarjeta de coincidencia de 30rem a la derecha desde lg, y en celular la tarjeta baja.

Las tarjetas tienen 1.5rem de relleno (2rem desde 48rem); los grupos internos usan huecos de 0.5–1.25rem. Todo control mide al menos 3.25rem de alto (3.75rem en `btn-grande`), y el desplazamiento a anclas deja 6rem arriba.

En celular, las pantallas internas tienen una barra inferior flotante al alcance del pulgar (oculta desde md) y el pie deja espacio debajo para no quedar tapado.

**The Barra Que No Parte Palabras Rule.** La barra inferior es un contenedor (`container-type: inline-size`) con tantas columnas como destinos (`--n`). Si mide menos de 22rem, por pantalla angosta o texto grande, pasa a 2 × 2 en vez de partir palabras. El umbral está en rem, así que sigue al tamaño de texto que eligió la persona.

## Elevation & Depth

Un sistema híbrido: la profundidad viene sobre todo del contraste tonal (tarjeta blanca sobre suelo durazno) y una sombra ambiente muy suave confirma que la tarjeta está encima. Las sombras son difusas y teñidas con tinta, nunca duras ni desplazadas.

### Shadow Vocabulary
- **Tarjeta en reposo** (`box-shadow: 0 1px 2px rgb(27 27 31 / 0.04), 0 14px 32px -22px rgb(27 27 31 / 0.28)`): toda `tarjeta`.
- **Tarjeta tocable al pasar** (`box-shadow: 0 14px 30px -18px rgb(27 27 31 / 0.35)`): junto con un ascenso de 2px.
- **Barra inferior** (`box-shadow: 0 10px 30px -12px rgb(27 27 31 / 0.35)`).
- **Desplegable** (`box-shadow: 0 24px 60px -20px rgb(27 27 31 / 0.45)`): paneles de accesibilidad y de cuenta.
- **Paso activo** (`box-shadow: 0 0 0 3px` tinta): anillo, no sombra; marca el criterio que se está leyendo en el gesto de la portada.

### Named Rules
**The Borde En Contraste Rule.** En alto contraste las tarjetas y la barra ganan un borde blanco de 2px, y en colores forzados toda tarjeta, opción, barra, estado y marca gana un borde `CanvasText`: la profundidad nunca depende solo de la sombra.

## Shapes

Formas blandas y generosas. Tres radios con nombre: control (1rem) para campos, opciones y avisos; tarjeta (1.75rem) para tarjetas y la barra inferior; grande (2.25rem) para tarjetas protagonistas (puertas, coincidencia de ejemplo, calculadora). Botones, segmentos, estados, enlaces de navegación y marcas son píldoras o círculos completos. Bloques internos de cifras y filas usan 1–1.5rem; cada destino de la barra inferior, 1.25rem (`barra-item`). El contorno de focus redondea a 0.5rem (`foco`). La marca de la app es un cuadrado de 12px de radio en tinta con figura en durazno.

Los bordes son de 2px y tienen significado: gris de control en campos, filete en opciones, tinta en el botón claro, ladrillo en peligro, punteado solo en «declarado». No hay bordes laterales de color en tarjetas o avisos.

Los íconos son dibujos propios de línea en retícula de 24 px, trazo 2,4 con puntas y uniones redondas; en el destino actual de la barra inferior el trazo sube a 2,8.

## Components

### Buttons
Píldoras gruesas y confiadas, con presión de resorte.
- **Shape:** píldora completa (999px), borde de 2px, alto mínimo 3.25rem.
- **Primary (`btn-accion`):** verde de acción con texto blanco, peso 800 a 1.0625rem, relleno 0.8rem 1.5rem.
- **Hover / Active:** el fondo se oscurece; al presionar, `scale(0.96)` con `--ease-resorte` en 0.35s.
- **Claro:** blanco con borde y texto en tinta; al pasar, suelo.
- **Suave:** `suelo-2` sin borde, para herramientas (accesibilidad, avisos, dictado).
- **Peligro:** blanco con borde y texto ladrillo; al pasar, `falta-suave`.
- **Grande / Ícono:** `btn-grande` sube a 3.75rem; `btn-icono` es un cuadro de 3rem con su nombre en `aria-label`.
- **Disabled:** `suelo-2` con texto gris cálido, opacidad completa (sigue legible).

### Chips
- **Estados (`estado-*`):** píldoras de peso 800 a 0.9375rem con ícono a la izquierda: verificado (sello, azul), declarado (conversación, contorno punteado), ajustable (reloj, ámbar, con fecha de compromiso al lado), falta (ladrillo). `estado-neutro` en suelo para rótulos como «Datos de demostración».
- **Segmentos:** radios reales ocultos bajo píldoras; elegido = fondo tinta y texto blanco. Usados en el panel de accesibilidad y en filtros.

### Cards / Containers
- **Corner Style:** 1.75rem; 2.25rem en `tarjeta-grande`.
- **Background:** blanco sobre suelo; cifras internas en bloques `suelo`.
- **Shadow Strategy:** sombra ambiente de reposo (ver Elevation & Depth).
- **Border:** ninguno, salvo alto contraste y colores forzados.
- **Internal Padding:** 1.5rem; 2rem desde 48rem.
- **Tocable:** al pasar sube 2px; al presionar, `scale(0.985)` con resorte en 0.4s.

### Inputs / Fields
- **Style:** blanco, borde 2px gris de control, radio 1rem, alto 3.25rem, texto 1.0625rem; al pasar, borde gris cálido.
- **Focus:** anillo de tinta de 3px a 2px de distancia y borde en tinta.
- **Error:** borde ladrillo con `aria-invalid`; mensaje en ladrillo con ícono de alerta debajo, y un resumen de errores que recibe el foco al enviar.
- **Opción tocable:** etiqueta grande que envuelve su casilla; marcada = borde verde y fondo `accion-suave`.
- **Sin JavaScript:** la fecha de compromiso aparece con `:has()` cuando se elige «Se puede ajustar».

### Navigation
- **Cabecera:** marca, enlaces en píldora (`nav-enlace`, 700, alto 2.9rem; al pasar `suelo-2`; actual en tinta con texto blanco), panel de accesibilidad y cuenta en `details` desplegables.
- **Barra inferior (celular):** tarjeta blanca flotante a 0.75rem de los bordes, radio 1.75rem, respeta `safe-area-inset-bottom`; ícono de 24px sobre etiqueta; el destino actual pasa a verde de acción con trazo 2,8.
- **Saltar al contenido:** píldora en tinta que aparece con el foco.

### Anillo de puntaje
Arco de tinta de 12 de trazo con puntas redondas sobre pista `suelo-2`, con el número en peso 900 al centro. El número y una frase para lector de pantalla siempre acompañan al dibujo.

### Filas de coincidencia
Lista de filas `suelo` de radio 1rem; cada una con una marca circular de 2.25rem a la izquierda, frase en negrita y detalle en gris cálido. Las marcas siguen The Fila En Tinta Rule.

### La coincidencia se arma (gesto propio)
En la portada, al bajar, las razones de la tarjeta de ejemplo aparecen y se apilan (opacidad, 28px de subida y escala 0.96 → 1) mientras el arco del anillo se llena y el número cuenta hasta el puntaje. GSAP ScrollTrigger con `scrub: 0.6`, sin fijar ni secuestrar el scroll (la tarjeta es `sticky` en lg); a la vez, el criterio que se está leyendo toma `paso-activo`: desplazamiento de 0.5rem y anillo de tinta, con `--ease-salida`. GSAP se carga solo si hay movimiento permitido. Sin JavaScript, con `prefers-reduced-motion` o con `data-movimiento="reducido"`, se muestra el estado final completo.

### Preferencias de accesibilidad
Cinco atributos en `html`, elegidos en el panel o en «Pruébalo aquí mismo», guardados en el dispositivo y aplicados en el servidor:
- `data-texto`: `grande` (118,75 %) o `enorme` (137,5 %).
- `data-contraste="alto"`: reemplaza todos los tokens de color (ver The Alto Contraste Rule) y oculta lo `decorativo`.
- `data-letra="legible"`: cambia el cuerpo a Atkinson Hyperlegible Next.
- `data-espaciado="amplio"`: interlínea 1.85, interletrado 0.04em, interpalabra 0.12em (WCAG 1.4.12).
- `data-movimiento="reducido"`: anula animaciones y transiciones, igual que `prefers-reduced-motion`.

Además, `prefers-contrast: more` oscurece `tinta-2`, `control` y `filete`, y `forced-colors: active` añade bordes del sistema y marca el destino actual con `Highlight`.

## Do's and Don'ts

### Do:
- **Do** reservar el verde de acción (`accion`) para botones, enlaces, casillas y el destino actual: lo que se puede tocar.
- **Do** decir cada estado de ajuste con su color, su ícono (sello, contorno punteado, reloj, equis) y su palabra.
- **Do** usar tinta sobre `suelo-2` en las marcas de sí y en parte de las filas de coincidencia, y el estado real en las filas de ajustes.
- **Do** usar el anillo de focus de tinta de 3px a 3px de distancia (amarillo `#ffe500` en alto contraste) en todo lo enfocable.
- **Do** mantener todo control en al menos 3.25rem de alto y todo tamaño y umbral en rem.
- **Do** cambiar colores a través de los tokens `--color-*` para que alto contraste y `prefers-contrast` sigan funcionando.
- **Do** mostrar el estado final de cualquier movimiento cuando no hay JavaScript o se pidió movimiento reducido.
- **Do** dibujar íconos nuevos en la retícula de 24 px con trazo 2,4 y puntas redondas, en línea, con `aria-hidden` y texto al lado.

### Don't:
- **Don't** usar degradados de fondo ni texto con degradado.
- **Don't** poner etiquetas de antetítulo (eyebrows o kickers) sobre los titulares, ni texto en mayúsculas con interletrado abierto.
- **Don't** usar bordes laterales de color como acento en tarjetas, filas o avisos.
- **Don't** pintar de verde un estado, un puntaje o una coincidencia buena.
- **Don't** usar sombras duras desplazadas; las sombras son difusas y teñidas con tinta.
- **Don't** comunicar un estado solo con color.
- **Don't** usar íconos de fuente, emojis o glifos como íconos.
