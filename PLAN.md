# Plan de Desarrollo — IncluTrabajo AI (React + Tailwind + Flask + MySQL)

Este documento detalla la arquitectura, el modelo de datos, la API, el diseño de la interfaz y el plan de implementación del MVP de **IncluTrabajo AI**.

---

## 1. Arquitectura del Sistema

```
React + Vite + Tailwind (:5173)
        │  fetch /api/*  (proxy de Vite en desarrollo)
        ▼
Flask REST API (:5000)  ──►  MySQL 9.6 (inclusivo_db)
                              usuario: inclusivo_user
```

- **Autenticación**: registro e inicio de sesión con correo y contraseña (hash Werkzeug); las cuentas demo siguen disponibles con un clic y están restringidas por `es_demo`. La cookie de sesión Flask almacena `perfil_id` y `rol`.
- **Sin CORS en desarrollo**: Vite redirige `/api` a Flask.
- **Producción**: `npm run build` genera `frontend/dist` y Flask lo sirve con fallback a `index.html`.
- **Estilos**: Tailwind v4 con `@tailwindcss/vite`; paleta tinta neutra, esmeralda (accesibilidad) y violeta (IA).
- **Accesibilidad transversal**: WCAG 2.2, lector de pantalla, TTS (texto a voz), dictado por voz, alto contraste y zoom escalable.

---

## 2. Estructura de Directorios

```
/
├── PLAN.md                    # Este documento
├── backend/
│   ├── app.py                 # Factory, rutas API, sesión y SPA static
│   ├── db.py                  # Conexión MySQL y helpers de consulta
│   ├── matching.py            # Motor de reglas y explicación
│   ├── init_db.py             # Inicialización de BD, usuario y seed
│   ├── schema.sql             # DDL de la base de datos
│   ├── seed.sql               # Datos demo (perfiles, competencias, vacantes)
│   ├── requirements.txt       # Dependencias Python
│   └── .env.example           # Plantilla de variables de entorno
└── frontend/
    ├── vite.config.js         # Configuración Vite + Tailwind + proxy API
    ├── package.json           # Dependencias Node.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx            # Enrutamiento principal
        ├── api/client.js      # Cliente fetch con manejo de sesión
        ├── contexts/          # SessionContext y AccessibilityContext
        ├── hooks/             # useSpeech (TTS/voz) y useRouteA11y
        ├── components/        # Layout, Navbar, Barra A11y, Tarjetas, Modales
        ├── pages/             # Welcome, Login, Register, Home, Vacantes, Panel Empresa, etc.
        └── styles/index.css   # @import "tailwindcss" y estilos accesibles
```

---

## 3. Modelo de Base de Datos (MySQL)

```sql
perfiles(id, rol ENUM('candidato','empresa'), nombre, email UNIQUE, password_hash, es_demo, activo, creado_en)
candidatos(perfil_id PK/FK, ciudad, telefono, experiencia_anios, modalidad_pref, jornada_pref, salario_min,
           consentimiento_datos, consentimiento_fecha, consentimiento_version)
empresas(perfil_id PK/FK, sector, ciudad)

competencias(id, nombre UNIQUE)
candidato_competencias(candidato_id, competencia_id, PK compuesta)

necesidades_accesibilidad(id, nombre, descripcion)
candidato_necesidades(candidato_id, necesidad_id, critica, PK compuesta)

vacantes(id, empresa_id FK, cargo, descripcion, ciudad, modalidad, jornada, salario, activa, creado_en)
vacante_requisitos(vacante_id, competencia_id, PK compuesta)
vacante_accesibilidad(vacante_id, necesidad_id, verificada, evidencia, verificada_en, PK compuesta)

postulaciones(id, candidato_id, vacante_id, estado, score, explicacion JSON, feedback, fecha, actualizado_en,
              UNIQUE(candidato_id, vacante_id))
postulacion_historial(id, postulacion_id, estado_anterior, estado_nuevo, comentario, cambiado_por, creado_en)
notificaciones(id, perfil_id, tipo, titulo, mensaje, url, leida, creada_en)
```

---

## 4. Endpoints de la API Flask

- `GET /api/health` — Estado del servidor
- `POST /api/auth/login` — Inicio de sesión con correo y contraseña
- `POST /api/auth/registro` — Registro de candidato o empresa
- `POST /api/auth/demo` — Acceso restringido a cuentas demo
- `GET /api/auth/demo-cuentas` — Cuentas demo para el login
- `GET /api/sesion` — Perfil y rol actuales en sesión
- `DELETE /api/sesion` — Cerrar sesión / cambiar rol
- `GET /api/catalogos` — Listar competencias y necesidades de accesibilidad
- `GET/PUT /api/candidato/perfil` — Perfil, competencias, necesidades, prioridad y consentimiento
- `GET /api/candidato/coincidencias` — Vacantes con score, desglose y explicación
- `GET /api/vacantes` — Catálogo público con búsqueda, filtros y paginación
- `GET /api/vacantes/<id>` — Detalle con checklist declarado/verificado
- `POST /api/postulaciones/<vacante_id>` — Postularse
- `GET /api/postulaciones` — Historial, estado, feedback y línea de tiempo
- `DELETE /api/postulaciones/<id>` — Retirar una postulación
- `GET/POST /api/empresa/vacantes` — Listar o publicar vacantes
- `PATCH /api/empresa/vacantes/<id>` — Editar vacante
- `PATCH /api/empresa/vacantes/<id>/estado` — Cerrar o reabrir
- `GET /api/empresa/vacantes/<id>/candidatos` — Ranking actual y explicación
- `PATCH /api/empresa/postulaciones/<id>/estado` — Actualizar estado y feedback
- `GET /api/notificaciones` — Avisos internos
- `PATCH /api/notificaciones/<id>/leida` — Marcar aviso como leído

---

## 5. Criterios de Aceptación y QA

1. **Acceso**: registro e inicio de sesión con correo y contraseña, más cuentas demo restringidas; la sesión persiste y se puede cerrar.
2. **Emparejamiento Justo**: cálculo de score (40% competencias, 30% accesibilidad, 15% ubicación/modalidad, 15% salario/jornada), con desglose visible, confianza, explicaciones en lenguaje claro y sin atributos demográficos.
3. **Accesibilidad Transversal**: navegación completa por teclado, lector de pantalla, tamaños de fuente escalables hasta 200%, alto contraste, TTS y dictado por voz.
4. **Persistencia**: datos en MySQL con consultas parametrizadas y transacciones en operaciones de varios pasos.
5. **Despliegue integrado**: `npm run build` integrado en Flask para servir la SPA de forma unificada.
6. **Validación**: pruebas unitarias de matching, pruebas de API y recorridos E2E con Playwright.
