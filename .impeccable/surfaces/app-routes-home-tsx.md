---
version: 1
slug: "app-routes-home-tsx"
primary_target: "app/routes/home.tsx"
related_targets: ["app/root.tsx","app/routes"]
---

# Surface brief — IncluTrabajo IA (portada y app)

Scope: toda la app web. La portada (`/`) es Persuade; las pantallas de persona y empresa son Operate. Una sola visual world para ambas.

Audience and job: personas con discapacidad que buscan empleo (celular de gama baja, lector de pantalla, baja alfabetización digital posible) y reclutadores de empresas con cuota Ley 2466. Cada quien elige su puerta en la portada; dentro, la persona entiende por qué una vacante encaja y se postula; la empresa publica puestos accesibles, ve candidaturas explicadas y su cuota.

Proof and content: datos DANE jun–ago 2026; cuentas y vacantes demo rotuladas como datos de demostración; sin testimonios ni clientes inventados.

Constraints: WCAG 2.2 AA, formularios sin JavaScript, movimiento solo en la portada y apagable, nada fuera de la instancia gratuita.

## Direction contract

THESIS: La inclusión laboral se siente como las apps que la gente ya usa a diario y en las que confía: tarjetas suaves, palabras de persona, y el único color fuerte en pantalla siempre es algo que se puede tocar. Rechaza la bolsa de empleo de tarjetitas grises y el héroe de plantilla con degradado violeta.

OWN-WORLD: Suelo durazno #FCE9DD, tarjetas blancas de 28–36 px de radio, tinta #1B1B1F y gris cálido #5A5A63; un solo color de acción verde Caribe #0B7A5C solo en lo accionable. Los estados nunca usan el verde de acción: verificado = sello azul #1F4FBF con check, declarado = contorno punteado, ajustable = reloj ámbar, falta = ladrillo #B3261E con equis. Figtree en todo; Atkinson Hyperlegible Next como letra de lectura que la persona puede activar. Íconos de línea de 2,4 px con puntas redondas.

STORY: En segundos la persona sabe que es gratis, que el puesto se revisa en sitio y que cada coincidencia se explica; la empresa ve que puede cumplir la cuota contratando bien. Cada quien toca su puerta.

FIRST VIEWPORT: Barra con marca, tres enlaces y «Entrar». Izquierda: titular enorme «Hola. Aquí tu talento cuenta.», párrafo y dos puertas grandes: «Busco empleo» en verde de acción y «Contrato talento» en blanco. Derecha: tarjeta de coincidencia de ejemplo (Ana, Auxiliar administrativo, anillo 93, tres razones en frases cortas, botón Postularme). En celular la tarjeta baja debajo de las puertas y las pantallas internas tienen barra inferior al alcance del pulgar.

FORM: Superficie de app de consumo cálida (desafío del catálogo digital-design-canon-warm-consumer-app-surface), elegida en la segunda re-tirada audaz. seed: 54c45c7d8c1c3558. Gesto propio: «la coincidencia se arma»; al bajar, las razones vuelan y se apilan en la tarjeta mientras el anillo cuenta hasta el puntaje (GSAP ScrollTrigger con scrub, sin secuestrar el scroll; con movimiento reducido se muestra el estado final). Presión con resorte suave en tarjetas y botones.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Decisiones abiertas

- Verificación por el rol técnico desde la interfaz (hoy los sellos vienen de la siembra demo).
- WhatsApp y correo transaccional (Brevo, plan gratuito) para avisos.
