# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React Router 7 (framework mode, SSR) + React 19 + TypeScript + Tailwind CSS 4, con controles HTML nativos y mejora progresiva (React Aria Components se evaluó y queda como opción para widgets que el HTML no cubre); PostgreSQL (`pg` en producción, PGlite en desarrollo y pruebas); argon2 para contraseñas. Despliegue en la instancia Oracle Always Free (ARM, Oracle Linux 10) junto a Frutii y EpicCord: servicio systemd aislado, base y rol propios en el Postgres existente, Caddy con TLS automático y subdominio DuckDNS. Costo de alojamiento: $0. Elegido por el equipo el 8-nov-2026 frente a Astro 7 y frente a mantener React SPA + Flask + MySQL. React Router 8 queda para cuando el servidor tenga Node ≥ 22.22.

## Users

Dos públicos con el mismo peso; la portada ofrece una entrada dividida:

- **Personas con discapacidad que buscan empleo formal en Colombia** (física, sensorial, intelectual, psicosocial o múltiple, mayores de 18 años), y familiares o tutores autorizados. Usan sobre todo celulares Android de gama baja con datos prepago; muchas usan lector de pantalla, magnificador, dictado o conmutador; algunas tienen baja alfabetización digital; muchas vienen de rechazos previos en procesos de selección.
- **Empresas**: reclutadores y gestión humana de empresas con 100 o más trabajadores obligadas a la cuota de la Ley 2466 de 2025 (2 personas con discapacidad por cada 100 trabajadores, exigible desde el 25-jun-2026), y mipymes que contratan por incentivos o convicción. Trabajan en computador de oficina; necesitan cumplir sin saber de ajustes razonables.
- Audiencias secundarias confirmadas: funcionarios de programas públicos de empleo y el equipo técnico propio (Ing. Civil y Biomédica) que verifica puestos.

## Product Purpose

Identificar capacidades, vincular laboralmente y acompañar la inclusión sociolaboral de personas con discapacidad, emparejando su talento con vacantes cuyo puesto es accesible o puede ajustarse. Éxito: contrataciones que duran (permanencia a 6 meses ≥ 80 %) y empresas que cumplen la cuota con buenos emparejamientos, no solo con números. Necesidad global (~1.300 millones de personas con discapacidad, OMS); mercado de entrada Colombia, piloto en Cartagena.

## Positioning

No es una bolsa de empleo: cruza tres cosas que las bolsas no cruzan (competencias, ajustes que la persona necesita y accesibilidad real del puesto, verificada en sitio por ingeniería civil y biomédica), explica cada coincidencia en lenguaje claro y acompaña la permanencia a 1, 3 y 6 meses. La accesibilidad del puesto tiene dos estados visibles: declarada por la empresa o verificada con evidencia.

## Operating Context

- Persona: registro, perfil de competencias, autoevaluación funcional opcional (6 dominios del Grupo de Washington) que sugiere ajustes, ajustes con prioridad (esencial, importante, deseable), coincidencias explicadas, postulación, seguimiento de estado, avisos.
- Empresa: publicar vacante con checklist de accesibilidad, Índice de Accesibilidad del Puesto (IAP), ranking de candidaturas explicado, cambio de estado con retroalimentación, calculadora de cuota y de deducción tributaria (Ley 361 de 1997, art. 31).
- Demostración pública el 19-nov-2026 (sustentación NRC 2357, UTB) con cuentas demo; luego Demo Day UTB 2026 y piloto en Cartagena (2027).

## Capabilities and Constraints

- Motor de emparejamiento explicable: S = 100·[0,40·C + 0,30·A + 0,15·U + 0,15·W]; A pondera cada ajuste por su estado (verificado 1, declarado 0,7, ajustable 0,5); un ajuste esencial sin cubrir marca «No compatible». Embeddings semánticos quedan para una fase posterior.
- La condición o el diagnóstico nunca son variables del puntaje; nunca se usan edad, sexo, etnia, nacionalidad ni discapacidad como criterio. Nunca se dice «no apto».
- Datos sensibles bajo Ley 1581 de 2012: autorización expresa, separada, revocable y opcional; ningún servicio se condiciona a ella (Decreto 1377 de 2013).
- La regla de la cuota es una interpretación preliminar hasta el decreto reglamentario: se guarda como parámetro, no como código fijo.
- Precios vigentes (Taller 10, COP 2026, antes de IVA) solo para material comercial; la demo es gratuita.
- Sin presupuesto de hosting: todo debe correr gratis en la instancia Oracle.
- Aún no existen: WhatsApp, verificación de correo, acompañamiento automático 1-3-6, multi-país, multi-idioma.

## Brand Commitments

- Nombre: **IncluTrabajo IA** (en español; «AI» queda retirado).
- Lenguaje: español de Colombia, claro, de trato digno; «personas con discapacidad», nunca «discapacitados» ni «en condición de».
- Gratis siempre para las personas.

## Evidence on Hand

- Datos DANE jun–ago 2026: ocupación 19,1 % con discapacidad frente a 61,0 % sin discapacidad.
- Talleres 1–10, diseño conceptual y modelo financiero en la carpeta del curso (ver `../CLAUDE.md`).
- No existen todavía testimonios, clientes, empresas aliadas ni casos de éxito: no inventarlos. Las cuentas y vacantes demo son sintéticas y se rotulan como tales.

## Product Principles

1. Talento primero: se empareja por lo que la persona sabe hacer y por lo que el puesto ofrece, nunca por su condición.
2. Explicar siempre: cada puntaje dice por qué y qué falta, sin jerga.
3. Verificado le gana a declarado: la evidencia en sitio es el valor que nadie más ofrece.
4. Funciona para quien tiene menos: celular de gama baja, mala señal, lector de pantalla, sin JavaScript.
5. La persona decide qué comparte, y puede cambiar de opinión.

## Accessibility & Inclusion

WCAG 2.2 nivel AA como piso (meta AAA en contraste de texto) y Resolución MinTIC 1519 de 2020. Debe funcionar con teclado, NVDA, TalkBack y VoiceOver, zoom 200 % y 400 % (reflow a 320 px), modo de alto contraste del sistema (forced colors), movimiento reducido y espaciado de texto aumentado. Lectura fácil por defecto (Fernández-Huerta ≥ 70). Formularios que funcionan sin JavaScript. Metas de prueba: 0 errores críticos de axe, Lighthouse accesibilidad ≥ 95, SUS ≥ 80 con usuarios de 6 perfiles (Taller 9).
