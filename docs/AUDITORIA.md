# Auditoría y rediseño de IncluTrabajo IA

Noviembre de 2026 · rama `rediseno-v2`. La versión anterior quedó intacta en `legacy/`.

## 1. Resumen

La versión anterior (React SPA + Flask + MySQL) funcionaba como prototipo, pero tenía rasgos de plantilla generada por IA, no funcionaba sin JavaScript, incumplía la Ley 1581 en el registro y necesitaba un servidor MySQL. Se reconstruyó como una sola aplicación **React Router 7 con render en servidor + PostgreSQL**, con un sistema visual propio, accesibilidad verificada con pruebas automáticas y despliegue gratuito en la instancia Oracle que ya corre Frutii y EpicCord.

| Medida | Antes | Después |
|---|---|---|
| Lighthouse móvil, portada (accesibilidad / buenas prácticas / SEO) | 96 / 100 / 91 | 100 / 100 / 100; también 100 en accesibilidad en coincidencias y candidaturas |
| Violaciones axe WCAG 2.2 AA | 9 de contraste y 1 de nombre accesible en la portada | 0 en las 20 páginas probadas, también en alto contraste |
| Funciona sin JavaScript | No (página en blanco) | Sí: entrar, postularse, filtrar, ajustar la página, gestionar candidaturas |
| Reflujo a 320 px | No probado | Sin scroll horizontal (probado en 5 páginas) |
| Señales de «AI slop» (detector Impeccable) | 9 | 0 (1 excepción documentada) |
| JavaScript comprimido | 112 KB, imprescindible para ver algo | ~110 KB base como mejora; GSAP (44 KB) solo en la portada y después de cargar |
| Pruebas | ~25 (pytest + Playwright) | 31 unitarias e integración + 21 de navegador, también contra PostgreSQL 17 real |
| Base de datos | MySQL (servidor aparte) | PostgreSQL existente en la instancia; PGlite en desarrollo sin instalar nada |
| Costo de alojamiento | Requería servidor | $0 en Oracle Always Free |

Evidencia: capturas de la versión anterior en `docs/auditoria/`; capturas de la nueva en `.impeccable/review/` (local); pruebas en `tests/`.

## 2. Hallazgos en la versión anterior

La app se ejecutó en local con un MySQL temporal para auditarla en el navegador, además de revisar el código.

**Plantilla de IA («AI slop»)**
- Degradados violeta en 7 componentes, titular con texto en degradado, manchas difuminadas de fondo y borde lateral de color en tarjetas (detector Impeccable: 9 hallazgos).
- Estructura de plantilla: héroe + «3 pasos» numerados 01/02/03 + dos columnas + llamado final; etiquetas pequeñas en mayúsculas sobre cada título.
- Afirmaciones sin evidencia en la portada («WCAG 2.2», «Sin sesgos demográficos») y una tarjeta de «92 % Match» inventada.

**Accesibilidad**
- Textos de 9 a 11 px y 9 fallas de contraste (Lighthouse móvil 96).
- Botón «Normal» con nombre accesible distinto del texto visible.
- Sin JavaScript no se veía nada: un celular viejo o una mala conexión dejaban a la persona sin servicio.
- No respetaba el movimiento reducido ni el contraste pedidos por el sistema operativo.

**Uso**
- En celular la cabecera ocupaba un tercio de la pantalla (7 enlaces en 3 filas).
- La página de coincidencias medía 9.200 px para 3 vacantes, con razones repetidas.
- Valores internos visibles («Medio_tiempo», «hibrido») y un «NO COMPATIBLE» en rojo que se leía como rechazo.

**Funcionamiento y normas**
- El registro **exigía** autorizar los datos de accesibilidad: va contra el art. 6 de la Ley 1581 de 2012 y el Decreto 1377 de 2013, que prohíben condicionar el servicio a datos sensibles.
- Quien retiraba una postulación no podía volver a postularse.
- El motor no distinguía entre ajuste verificado y declarado, y no existían la calculadora de cuota de la Ley 2466, el índice de accesibilidad del puesto ni la autoevaluación funcional.

## 3. Framework: por qué React Router 7

| Criterio | React Router 7 (elegido) | Next.js | Astro 7 | SvelteKit | Mantener SPA + Flask |
|---|---|---|---|---|---|
| HTML completo desde el servidor | Sí | Sí | Sí | Sí | No |
| Formularios que funcionan sin JavaScript | Sí, es su modelo base | Parcial (server actions) | Sí (actions) | Sí | No |
| Pantallas con mucho estado (perfil, panel) | Muy bien | Muy bien | Regular (islas) | Muy bien | Bien |
| Una sola base de código y un solo runtime | Sí | Sí | Sí | Sí | No (Python + JS) |
| Aprovecha lo que el equipo ya sabe | React | React | Astro (EpicCord) | Nuevo | Sí |
| Corre igual en la instancia Oracle | Sí, Node | Sí, pero pensado para Vercel | Sí | Sí | Requiere MySQL |

React Router 7 gana por la **mejora progresiva**: cada formulario es un `<form>` real que el servidor procesa, y el JavaScript solo lo hace más ágil. Para el público de este producto (celulares sencillos, mala señal, lectores de pantalla) eso es accesibilidad, no un detalle técnico. Se usa la línea 7.18 porque React Router 8 exige Node 22.22 y no conviene cambiar el Node que comparte Frutii en el servidor.

**Componentes.** Se planteó React Aria Components. En la construcción, los controles nativos del navegador (botones, radios, casillas, `<details>`, `<select>`) cubrieron todo con mejor soporte sin JavaScript, así que no se agregó la librería. Queda como opción para widgets que el HTML no ofrece, como un autocompletado de competencias.

**Base de datos.** PostgreSQL (el mismo servicio que ya usa Frutii) en lugar de MySQL: tiene `jsonb` para la autoevaluación, arreglos para sinónimos de competencias, y abre la puerta a `pgvector` para el emparejamiento semántico de la fase 2. En desarrollo y en pruebas se usa **PGlite**, PostgreSQL real compilado a WASM: `npm run dev` funciona sin instalar ninguna base.

## 4. Alojamiento gratuito

| Opción | Costo | Ventaja | Límite a tener en cuenta (verificar términos vigentes) |
|---|---|---|---|
| **Oracle Always Free (elegida)** | $0 | Ya existe con 4 OCPU y 24 GB, Postgres, Caddy y DuckDNS montados; sin suspensión por inactividad | Hay que administrar el servidor; Oracle puede reclamar instancias gratuitas inactivas |
| Cloudflare Workers + D1 | $0 | CDN global y uso comercial permitido | Obliga a reescribir para Workers y SQLite (D1); límites diarios de peticiones |
| Vercel Hobby | $0 | Despliegue con un clic | Plan para uso personal no comercial |
| Render (plan gratis) | $0 | Sencillo | El servicio se duerme tras inactividad y tarda en despertar |
| Supabase o Neon (Postgres gratis) | $0 | Postgres gestionado | Pausa o escala a cero sin uso; límites de almacenamiento |

La instancia Oracle es la mejor opción porque ya está pagada (gratis), siempre encendida y bajo control del equipo. IncluTrabajo se monta como un servicio más, aislado de Frutii y EpicCord: guía en `deploy/SETUP.md`.

## 5. El rediseño

**Mundo visual: «App de confianza».** Se eligió en una ronda de dirección con tres manos (la asignada, una más segura y una más audaz). Suelo durazno, tarjetas blancas de esquinas suaves, palabras de persona, y **un solo color fuerte (verde Caribe) reservado para lo que se puede tocar**. Los estados del puesto nunca usan ese verde: sello azul para *verificado*, contorno punteado para *declarado*, reloj ámbar para *se puede ajustar*, ladrillo para *falta*. Así nadie confunde un estado con un botón, y el estado nunca depende solo del color (siempre lleva ícono y texto).

**Gesto propio: «la coincidencia se arma».** En la portada, al bajar, las razones de una coincidencia real (calculada por el motor con los datos demo) se apilan y el anillo cuenta hasta el puntaje (GSAP ScrollTrigger con *scrub*, sin secuestrar el scroll). Con movimiento reducido o sin JavaScript se ve el estado final completo.

**Casos típicos y atípicos atendidos**

| Persona o empresa | Cómo la atiende la plataforma |
|---|---|
| Ciega o con baja visión | Estructura semántica con regiones y títulos, foco y anuncio al cambiar de página, anillos con texto equivalente, ampliación hasta 400 % con reflujo, alto contraste, letra Atkinson Hyperlegible, voz para escuchar explicaciones |
| Sordociega (línea braille) | Todo es texto real, sin información solo visual ni solo sonora |
| Sorda o con hipoacusia | Nada depende del audio; ajustes de intérprete de LSC y subtítulos en el modelo de datos |
| Movilidad reducida o conmutador | Objetivos táctiles de al menos 48 px, todo por teclado, barra inferior al alcance del pulgar, dictado por voz en campos de texto |
| Discapacidad intelectual o psicosocial | Frases cortas, una idea por fila, «modo sin animaciones», nada de cuentas regresivas, confirmaciones en dos pasos |
| Adultos mayores o baja alfabetización digital | Texto grande opcional, botones con palabras («Postularme», «Guardar y avisar»), errores que dicen cómo corregir |
| Celular de gama baja o mala señal | HTML desde el servidor, formularios sin JavaScript, fuentes propias livianas, GSAP solo donde aporta |
| Persona que no quiere revelar su discapacidad | La autoevaluación es opcional y nunca entra al puntaje; la empresa no ve los ajustes sin autorización |
| Quien retira y vuelve | Puede retirarse y volver a postularse |
| Empresa con 100 o más trabajadores | Calculadora de cuota de la Ley 2466, ahorro por deducción del 200 %, reporte imprimible |
| Mipyme sin área de RR. HH. | Lenguaje sin jerga, autoevaluación del puesto guiada, cuota 0 explicada con incentivos voluntarios |
| Empresa que declara sin verificar | Lo declarado cuenta menos (0,7) que lo verificado (1,0) y la persona ve la diferencia |

**Seguridad.** argon2id para contraseñas; cookie de sesión firmada, `HttpOnly` y `SameSite=Lax`; verificación de origen en cada envío (CSRF); freno de intentos de login; redirecciones solo internas; cabeceras de seguridad y CSP en Caddy; consultas parametrizadas; transacciones en operaciones de varios pasos.

## 6. Pendiente

- Rol técnico en la interfaz para registrar verificaciones con evidencia (hoy vienen de la siembra).
- Avisos por correo (Brevo, plan gratuito, como en Frutii) y por WhatsApp.
- Emparejamiento semántico con embeddings multilingües (`pgvector`) y auditoría de sesgos con la razón de impacto adverso.
- Videos en Lengua de Señas Colombiana y versión en inglés y portugués.
- Prueba con personas usuarias de los 6 perfiles del Taller 9 (meta SUS ≥ 80).
