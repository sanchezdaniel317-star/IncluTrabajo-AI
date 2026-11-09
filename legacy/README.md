# IncluTrabajo AI

Plataforma web accesible de emparejamiento laboral inclusivo. Conecta competencias reales con vacantes cuyas condiciones de accesibilidad son compatibles o pueden ajustarse, con explicaciones claras y sin usar atributos protegidos.

---

## Estado del proyecto

MVP demostrable con:

- Registro e inicio de sesión con correo y contraseña, más cuentas demo de un clic.
- Perfil de candidato con competencias, necesidades de accesibilidad y prioridad (esencial/importante).
- Consentimiento explícito para compartir datos de accesibilidad con empresas.
- Motor de emparejamiento v2 explicable (40 % competencias, 30 % accesibilidad, 15 % ubicación/modalidad, 15 % salario/jornada).
- Catálogo de vacantes con búsqueda y filtros.
- Postulaciones con estados, retroalimentación, historial y notificaciones internas.
- Panel de empresa para publicar, editar, cerrar y reabrir vacantes, y gestionar candidaturas.
- Accesibilidad: teclado, foco visible, alto contraste, zoom hasta 200 %, TTS, dictado por voz y formularios con errores asociados.
- Política de privacidad y distinción entre accesibilidad **declarada** y **verificada**.

---

## Arquitectura

```text
React + Vite + Tailwind (:5173 en desarrollo)
        │  fetch /api/*
        ▼
Flask REST API (:5000) ──► MySQL (inclusivo_db)
```

- **Frontend:** React 19, React Router, Tailwind CSS v4, iconografía SVG propia.
- **Backend:** Flask 3, sesión con cookie firmada, contraseñas con hash Werkzeug, consultas parametrizadas.
- **Base de datos:** MySQL 8/9.
- **Producción:** `npm run build` genera `frontend/dist`; Flask sirve la SPA y resuelve enlaces profundos.

---

## Requisitos

- Python 3.10 o superior.
- Node.js 18 o superior.
- MySQL 8.0 o superior.
- Para pruebas E2E: Microsoft Edge o Chromium y Playwright de Python.

---

## Instalación

### 1. Base de datos

Crea la base y el usuario (ajusta la contraseña si lo deseas):

```sql
CREATE DATABASE inclusivo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'inclusivo_user'@'localhost' IDENTIFIED BY 'Inclusivo2026!';
GRANT ALL PRIVILEGES ON inclusivo_db.* TO 'inclusivo_user'@'localhost';
FLUSH PRIVILEGES;
```

Opción automática, desde `backend`:

```powershell
pip install -r requirements.txt
copy .env.example .env
# Edita .env y define SECRET_KEY
python init_db.py          # pide credenciales de root y carga schema + seed
# o, si prefieres definir MYSQL_ROOT_PASSWORD en el entorno:
python setup_db.py
```

Si la base ya existía antes de la versión con autenticación, aplica la migración:

```powershell
python migrate_db.py
```

Para restaurar la demo antes de una presentación:

```powershell
python reset_demo.py
```

### 2. Frontend

```powershell
cd frontend
npm install
npm run build
```

### 3. Ejecutar

```powershell
cd backend
python app.py
# http://127.0.0.1:5000
```

Por defecto el servidor escucha en `127.0.0.1:5000`. Para desarrollo con recarga del frontend puedes usar `npm run dev`, pero Flask ya sirve el build compilado.

---

## Cuentas demo

Todas usan la contraseña **`Demo2026!`** y también pueden entrar con un clic desde `/login`.

| Rol | Nombre | Correo |
|---|---|---|
| Candidato | Ana Torres | `ana.torres@demo.com` |
| Candidato | Carlos Gómez | `carlos.gomez@demo.com` |
| Empresa | TechIncluye S.A.S. | `contacto@techincluye.com` |
| Empresa | Comercial del Caribe | `rrhh@comercialcaribe.com` |

Las cuentas demo están marcadas con `es_demo = TRUE`. El endpoint de acceso demo solo acepta esas cuentas, de modo que no se puede suplantar a una persona registrada.

---

## Flujo de demostración

1. **Bienvenida** (`/`): propuesta de valor y acceso a registro o login.
2. **Login** (`/login`): correo/contraseña + recuadro de cuentas demo + enlace a registro.
3. **Registro** (`/registro`): candidato o empresa, consentimiento y términos.
4. **Candidato**:
   - completa el perfil y marca necesidades esenciales;
   - revisa el desglose explicable en `/coincidencias`;
   - explora el catálogo en `/vacantes`;
   - se postula y sigue estado, historial y retroalimentación en `/postulaciones`;
   - recibe avisos en `/notificaciones`.
5. **Empresa**:
   - publica una vacante con checklist de accesibilidad;
   - revisa postulantes con score actual y explicación;
   - actualiza el estado y deja retroalimentación;
   - cierra o reabre vacantes y consulta el número de postulantes.
6. **Privacidad** (`/privacidad`) y **ayuda** (`/ayuda`).

---

## Pruebas

Con el frontend compilado y MySQL activo:

```powershell
python -m pytest
```

Incluye:

- Pruebas unitarias del motor de emparejamiento: pesos, jornada, modalidad, necesidades esenciales, datos ausentes y ausencia de atributos protegidos.
- Pruebas de API: autenticación, permisos por rol, registro, catálogo, verificación y errores JSON.
- Pruebas E2E con Playwright: login real, cuentas demo, registro, flujo candidato, flujo empresa, zoom, alto contraste y responsive. Las pruebas E2E levantan su propio servidor en el puerto **5055**.

Si Edge no está disponible, Playwright intenta usar Chromium.

---

## Accesibilidad

- Navegación completa por teclado y enlace para saltar al contenido.
- Foco visible con contorno y halo de contraste.
- Textos pequeños con contraste AA; botones teal y avatares ajustados.
- Alto contraste con fondos negros, texto blanco, enlaces amarillos y foco amarillo.
- Zoom propio hasta 200 % y diseño responsive; probado a 390 px.
- TTS (“Leer página”) que se detiene al cambiar de ruta.
- Dictado por voz con Web Speech API en Chrome/Edge.
- Errores de formulario con `aria-invalid` y referencias `aria-describedby`.
- Mensajes de estado con `role="status"` y errores con `role="alert"`.

La verificación formal con NVDA y axe queda documentada como pendiente en `docs/ACCESIBILIDAD.md`; las comprobaciones automatizadas cubren parte del recorrido.

---

## Privacidad y datos sensibles

- Las necesidades de accesibilidad se tratan como datos sensibles.
- El candidato autoriza expresamente compartirlas con empresas y puede revocarlo en su perfil.
- Si no hay consentimiento, la empresa ve el score de compatibilidad pero no los ajustes ni los detalles de accesibilidad.
- El teléfono es opcional y no se muestra a las empresas.
- La política completa está en `/privacidad`.

---

## Seguridad y despliegue

- Contraseñas con `generate_password_hash` (scrypt).
- Sesión con cookie `HttpOnly`, `SameSite=Lax` y `Secure` configurable.
- Validación de origen para peticiones de escritura y validación de entrada en el servidor.
- Consultas parametrizadas y transacciones en operaciones de varios pasos.
- Errores JSON para la API, incluido 404 de rutas `/api/*`.
- `.env` fuera de control de versiones (`.gitignore`).
- `debug` desactivado por defecto; `SECRET_KEY` obligatoria.

Para producción todavía falta: HTTPS, servidor WSGI (Waitress/Gunicorn), CSRF con token, límites de tasa distribuidos, respaldos, migraciones versionadas, monitoreo y verificación de correo. La demo no envía correos ni usa WhatsApp.

---

## Limitaciones y trabajo futuro

- La verificación de accesibilidad es demostrativa: hay un campo de evidencia y datos sembrados, pero no un panel de auditoría.
- No hay recuperación de contraseña por correo ni verificación de email.
- No hay WhatsApp, chatbot, mensajería, foros ni notificaciones externas.
- No hay acompañamiento post-contratación, reconocimiento de títulos ni reportería ODS.
- No hay aplicación móvil nativa, PWA, modo offline ni multilingüismo.
- No hay API pública para ATS ni arquitectura multi-tenant.
- El proyecto usa un diseño visual propio (tinta/violeta/esmeralda) distinto de la paleta preliminar del PDF (azul/teal/naranja); el cambio debe explicarse en la presentación.

---

## Estructura

```text
backend/
  app.py             API Flask, autenticación, matching y SPA
  db.py              Conexión MySQL, consultas y transacciones
  matching.py        Motor explicable v2
  schema.sql         Esquema completo
  seed.sql           Datos demo
  init_db.py         Inicialización interactiva
  setup_db.py        Inicialización con credenciales root
  migrate_db.py      Migración de bases existentes
  reset_demo.py      Restauración de la demo
  tests/             Pruebas unitarias y de API
frontend/
  src/pages/         Welcome, Login, Register, Home, Matches, Vacancies, etc.
  src/components/    NavBar, Layout, iconos, accesibilidad
  src/contexts/      Sesión y preferencias de accesibilidad
  src/styles/        Sistema de diseño Tailwind
tests/e2e/           Pruebas Playwright
docs/                Guion de demo y checklist de accesibilidad
```

---

## Problemas frecuentes

- **“Frontend no compilado”**: ejecuta `npm run build` en `frontend/`.
- **Error de conexión a MySQL**: revisa que el servicio esté activo y que `backend/.env` tenga las credenciales correctas.
- **Falta SECRET_KEY**: copia `backend/.env.example` a `backend/.env` y define una clave.
- **Cambios de estilos no visibles**: vuelve a compilar y recarga con `Ctrl + F5`.
- **El login demo no aparece**: ejecuta `python migrate_db.py` y luego `python reset_demo.py`.
