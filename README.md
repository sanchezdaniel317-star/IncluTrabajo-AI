# IncluTrabajo IA

Plataforma de vinculación laboral para personas con discapacidad en Colombia. Cruza tres cosas que una bolsa de empleo no cruza: lo que la persona sabe hacer, los ajustes que necesita y la accesibilidad real del puesto, verificada en sitio por ingeniería civil y biomédica. Cada coincidencia se explica en palabras sencillas. Gratis, siempre, para las personas.

Proyecto del curso Negocios Inclusivos (NRC 2357), Universidad Tecnológica de Bolívar, Cartagena, 2026.

## Probarlo en tu computador

Requisitos: Node.js 20.19 o superior. **No necesitas instalar ninguna base de datos.**

```bash
npm install
npm run dev
```

Abre <http://127.0.0.1:5173>. La primera vez se crea una base PostgreSQL embebida (PGlite) en `.data/pglite` con datos de demostración. En `/ingresar` hay botones para entrar con cuentas demo; la contraseña de todas es `Demo2026!`.

Para empezar de cero: borra la carpeta `.data` o ejecuta `npm run db:reset-demo`.

## Qué hay

- **Personas:** registro (la autorización de datos sensibles es opcional), perfil de competencias, autoevaluación funcional opcional que sugiere ajustes, coincidencias explicadas, postulación, seguimiento y avisos.
- **Empresas:** vacantes con checklist de accesibilidad e Índice de Accesibilidad del Puesto, candidaturas ordenadas por compatibilidad, cambio de estado con mensaje obligatorio al descartar, calculadora de cuota de la Ley 2466 y de deducción tributaria.
- **Para todas las personas:** texto grande, alto contraste, letra de alta legibilidad, espacio amplio, sin animaciones, voz para escuchar y dictado. Todo funciona sin JavaScript.

## Motor de emparejamiento

`app/lib/matching.ts`: S = 100 · [0,40·C + 0,30·A + 0,15·U + 0,15·W]. A pondera cada ajuste por su estado (verificado 1, declarado 0,7, se puede ajustar 0,5). Un ajuste esencial que falta marca «Falta un ajuste esencial». Nunca usa edad, sexo, etnia, nacionalidad ni discapacidad.

## Pruebas

```bash
npm test                 # 31 pruebas unitarias y de integración (PGlite en memoria)
npm run build
npx playwright test      # 21 pruebas de navegador: axe WCAG 2.2 AA, sin JavaScript, reflujo a 320 px
```

Playwright usa el Microsoft Edge instalado (`PW_CHANNEL=chrome` para Chrome). Con `DATABASE_URL` definida, todo corre contra PostgreSQL real.

## Producción

Una sola app Node (React Router 7 con render en servidor) + PostgreSQL, detrás de Caddy. Guía completa para la instancia Oracle Always Free: [`deploy/SETUP.md`](deploy/SETUP.md). Actualizar: `sudo bash deploy/actualizar.sh`.

## Estructura

```text
app/
  root.tsx            documento, cabecera, preferencias de accesibilidad, foco al navegar
  app.css             sistema de diseño (tokens y componentes)
  routes/             portada, vacantes, cuenta, persona/*, empresa/*
  components/         armazón, íconos propios, piezas de interfaz
  lib/                motor de emparejamiento, cuota y deducción, IAP, catálogos
  .server/            base de datos, sesión, seguridad, consultas
db/                   migraciones SQL y siembra de demostración
scripts/              migrar y sembrar desde la línea de comandos
deploy/               servicio systemd, bloque de Caddy, guía y script de actualización
tests/                unit/, integracion/, e2e/
docs/AUDITORIA.md     auditoría de la versión anterior y decisiones del rediseño
DESIGN.md             sistema visual (colores, tipografía, reglas); PRODUCT.md: para quién y por qué
legacy/               versión anterior (React SPA + Flask + MySQL), solo como referencia
```
