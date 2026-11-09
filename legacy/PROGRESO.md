# Estado del proyecto — IncluTrabajo AI

**Fecha de corte:** 21 de octubre de 2026  
**Ubicación:** repositorio local del proyecto  
**Estado general:** MVP funcional en entorno local con autenticación real, registro, matching v2, consentimiento, verificación demostrativa, ciclo de postulaciones, notificaciones, catálogo y pruebas automatizadas. Queda la auditoría formal de accesibilidad y las funcionalidades de fases posteriores.

---

## 1. Resumen ejecutivo

| Componente | Estado |
|---|---|
| Base de datos MySQL | ✅ Creada y poblada (`inclusivo_db`, usuario `inclusivo_user`) |
| Backend Flask | ✅ Funcional, más de 30 endpoints, con autenticación, matching v2, notificaciones y pruebas |
| Frontend React + Vite + Tailwind | ✅ Compila y navega; 14 páginas con sistema de diseño propio |
| Emparejamiento explicable | ✅ Implementado y visible en la interfaz |
| Accesibilidad transversal | 🟡 Base implementada (TTS, dictado, teclado, contraste, zoom); falta auditoría formal |
| Diseño visual y experiencia de uso | ✅ Sistema de diseño completo, iconografía SVG y vistas verificadas en escritorio y móvil |
| Despliegue integrado | ✅ Flask sirve `frontend/dist` y resuelve enlaces profundos |
| Autenticación real | ✅ Registro y login con correo/contraseña; cuentas demo restringidas |
| Pruebas automatizadas en el repositorio | ✅ pytest (matching, API) y Playwright E2E |
| Documentación de uso | ✅ README de instalación y guía de uso creados en la raíz del proyecto |

---

## 2. Lo que ya está implementado

### 2.1 Backend (Flask + MySQL)

Archivo principal: `backend/app.py`.

**Endpoints disponibles (16):**

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/sesion` | Perfil y rol de la sesión actual |
| GET | `/api/sesion/opciones` | Perfiles demo para elegir rol |
| POST | `/api/sesion` | Iniciar sesión demo con `perfil_id` |
| DELETE | `/api/sesion` | Cerrar sesión / cambiar rol |
| GET | `/api/catalogos` | Competencias y necesidades de accesibilidad |
| GET | `/api/candidato/perfil` | Perfil completo del candidato |
| PUT | `/api/candidato/perfil` | Actualizar datos, competencias y necesidades |
| GET | `/api/candidato/coincidencias` | Vacantes ordenadas por compatibilidad explicada |
| GET | `/api/vacantes` | Catálogo de vacantes activas con filtros `ciudad` y `modalidad` |
| GET | `/api/vacantes/<id>` | Detalle de vacante con checklist de accesibilidad |
| POST | `/api/postulaciones/<vacante_id>` | Postularse a una vacante |
| GET | `/api/postulaciones` | Historial de postulaciones del candidato |
| GET | `/api/empresa/vacantes` | Vacantes de la empresa en sesión |
| POST | `/api/empresa/vacantes` | Publicar una nueva vacante |
| GET | `/api/empresa/vacantes/<id>/candidatos` | Ranking explicable de candidatos postulados |

**Base de datos:**

- Esquema en `backend/schema.sql`: `perfiles`, `candidatos`, `empresas`, `competencias`, `candidato_competencias`, `necesidades_accesibilidad`, `candidato_necesidades`, `vacantes`, `vacante_requisitos`, `vacante_accesibilidad`, `postulaciones`.
- Datos demo en `backend/seed.sql`:
  - 2 candidatos: Ana Torres y Carlos Gómez.
  - 2 empresas: TechIncluye S.A.S. y Comercial del Caribe.
  - 3 vacantes activas.
  - 8 competencias y 8 necesidades de accesibilidad.
  - 1 postulación de prueba creada durante la verificación (Ana Torres → Auxiliar Administrativo Inclusivo, score 100). Se puede eliminar si se quiere entregar la base sin postulaciones.
- Credenciales locales en `backend/.env` (host `127.0.0.1`, base `inclusivo_db`, usuario `inclusivo_user`).
- Usuario MySQL `inclusivo_user@localhost` con privilegios sobre `inclusivo_db`.

**Motor de emparejamiento** (`backend/matching.py`):

- 40 % competencias.
- 30 % accesibilidad del puesto frente a necesidades declaradas.
- 15 % ubicación/modalidad.
- 15 % salario/jornada (en la práctica hoy solo pondera salario; ver pendientes).
- Genera `score`, `nivel` (`Alta`, `Media`, `Baja`), `razones` y `faltantes` en lenguaje claro.
- No usa edad, género, nacionalidad ni discapacidad como criterio de puntuación.

**Correcciones aplicadas en esta sesión:**

1. Se corrigieron dos errores de sintaxis en `app.py` (llaves `}}` sobrantes en respuestas 404/403) que impedían arrancar el backend.
2. Se creó `backend/.env` con la configuración local funcional.
3. Se corrigió el servido de la SPA: antes `/ayuda`, `/perfil`, etc. devolvían 404 al recargar; ahora Flask sirve `index.html` para rutas del cliente y los archivos de `dist`.
4. Se reescribió `backend/init_db.py` para no usar la opción inválida `multi_query` y ejecutar el SQL sentencia por sentencia. **No se volvió a ejecutar porque la base ya estaba creada**, así que queda pendiente probarlo en una instalación limpia.

### 2.2 Frontend (React + Vite + Tailwind)

**Rutas implementadas** (`frontend/src/App.jsx`):

| Ruta | Página | Acceso |
|---|---|---|
| `/` | Selección de rol demo | Público |
| `/inicio` | Dashboard de candidato o empresa | Sesión iniciada |
| `/perfil` | Perfil y accesibilidad del candidato | Candidato |
| `/coincidencias` | Emparejamiento IA explicado | Candidato |
| `/vacantes/:id` | Detalle de vacante y postulación | Candidato |
| `/postulaciones` | Historial de postulaciones | Candidato |
| `/empresa` | Panel de empresa | Empresa |
| `/empresa/vacantes/nueva` | Publicar vacante inclusiva | Empresa |
| `/empresa/vacantes/:id/candidatos` | Candidatos postulados y ranking | Empresa |
| `/ayuda` | Ayuda y accesibilidad | Público |
| `*` | Página 404 | Público |

**Páginas y funciones visibles:**

- Selección de perfiles demo de candidato y empresa, con botones de acceso claros.
- Dashboard con bienvenida, rol y accesos rápidos.
- Perfil de candidato editable: datos personales, ciudad, teléfono, experiencia, aspiración salarial, modalidad, jornada, competencias y necesidades de accesibilidad.
- Coincidencias con score, nivel, razones de la IA, brechas y checklist de accesibilidad de cada vacante.
- Detalle de vacante con descripción, requisitos, accesibilidad declarada, lectura en voz alta y botón de postulación.
- Historial de postulaciones con estado, score y resumen de compatibilidad.
- Panel de empresa con vacantes propias y acceso al ranking de postulantes.
- Formulario de publicación de vacante con requisitos y checklist de accesibilidad.
- Ranking de candidatos postulados con score, explicación, datos de contacto y necesidades declaradas.
- Página de ayuda con instrucciones de uso, atajos de teclado y política de privacidad de la demo.

**Accesibilidad implementada:**

- Enlace “Saltar al contenido principal”.
- Barra de accesibilidad global: tamaño de letra (`A−`, `Normal`, `A+`), alto contraste y movimiento reducido, persistentes en `localStorage`.
- Foco visible con contorno de alto contraste y foco programático en el `h1` de cada ruta.
- Región `aria-live` para anuncios a lectores de pantalla.
- Texto a voz (TTS) con “Leer Página” y “Escuchar Vacante”.
- Dictado por voz (ASR) con botón 🎙️ en nombre, ciudad, teléfono, cargo, descripción y ciudad de la vacante. Funciona en Chrome/Edge y no envía audio al servidor.
- Etiquetas `label`, `aria-label`, `aria-pressed`, `role="alert"`, `role="status"` y botones con área mínima de toque.
- Estructura semántica por encabezados y navegación con Tab/Shift+Tab.

**Build:**

- `npm install` completado en `frontend/`.
- `npm run build` compila correctamente y genera `frontend/dist` (HTML, CSS y JS).
- Flask sirve el build en `http://127.0.0.1:5000`.

### 2.3 Rediseño de UI/UX (última iteración)

Se rehízo la capa visual completa sin cambiar la lógica de negocio ni el contrato de la API:

- **Sistema de diseño centralizado** en `frontend/src/styles/index.css`: tokens de color, sombras suaves y clases reutilizables (`btn-primary`, `btn-secondary`, `card`, `field-input`, `chip`, `badge-*`, `alert-*`, `empty-state`, `page-header`, `nav-link`, `skeleton`, `text-gradient`, `glass`).
- **Paleta actual**: tinta neutra como primario, esmeralda para accesibilidad/positivo y violeta para la capa de IA. Fondo claro con halos radiales, tipografía Inter y acentos en degradado.
- **Navegación**: cabecera tipo glass con desenfoque, logo con degradado violeta, `NavLink` como píldora activa, avatar con iniciales y rol de la sesión. La cabecera es fija solo en escritorio para no ocupar espacio en móvil.
- **Barra de accesibilidad**: iconos SVG, botones tipo píldora con estado `aria-pressed` y porcentaje de zoom visible (100 % por defecto).
- **Iconografía SVG propia** en `frontend/src/components/Icons.jsx` (35 iconos): sustituye emojis para garantizar el mismo aspecto en todos los equipos, incluido el botón de dictado.
- **Componentes de estado**: skeletons de carga, estados vacíos ilustrados con llamada a la acción, alertas de error/éxito consistentes y microanimaciones de entrada.
- **Pantallas rediseñadas**: selección de rol, inicio, emparejamiento (tarjetas con barra de compatibilidad y explicación en dos columnas), detalle de vacante (cabecera destacada y barra de acciones fija), perfil, postulaciones, panel de empresa, publicación de vacante, ranking de candidatos, ayuda y 404.
- **Mejoras funcionales de UX**: el ranking de empresa ahora muestra las competencias declaradas por cada candidato; las tarjetas de accesibilidad son botones reales navegables por teclado (antes eran `div` con clic); la página activa ya no se duplica cuando una ruta es prefijo de otra.
- **Bienvenida y login separados**: la ruta `/` muestra una pantalla de bienvenida (`Welcome.jsx`) con hero, vista previa de una coincidencia, pasos de uso, bloques para candidatos/empresas y llamada final. La selección de perfiles demo se movió a `/login` (`Login.jsx`), conservando las cuentas de demostración y avisando de que el acceso con correo y contraseña llegará en la versión final. Si no hay sesión, las rutas protegidas redirigen a `/login`; «Cambiar rol» cierra la sesión y vuelve al login.

### 2.4 Verificaciones realizadas

| Verificación | Resultado |
|---|---|
| `python -m py_compile` en archivos del backend | ✅ Sin errores |
| Conexión a MySQL y consultas de conteo | ✅ 4 perfiles, 3 vacantes, 1 postulación |
| Prueba de más de 30 endpoints con sesión real | ✅ Respuestas 200/201 correctas |
| Login candidato, perfil, coincidencias, postulación | ✅ Funciona; score 100 en la vacante compatible |
| Login empresa, panel, candidatos postulados | ✅ Funciona; ranking ordenado por score |
| `npm run build` | ✅ Compila (CSS 72 kB, JS 349 kB) |
| Servido de `/`, `/login`, `/ayuda`, `/perfil`, `/empresa/vacantes/nueva` | ✅ 200 con `index.html` |
| Servido de assets `/assets/...` | ✅ 200 con `text/javascript` |
| Recorrido E2E con Edge headless (Playwright) | ✅ 14 pantallas (10 escritorio + 3 móviles), 0 errores de consola |
| Revisión visual en móvil a 390 px | ✅ Sin desbordes; navegación y tarjetas adaptadas |
| Capturas de pantalla de las pantallas principales | ✅ Generadas fuera del proyecto |

### 2.5 Actualización de alcance (entrega)

Se completó el paquete de mejoras necesarias para la entrega:

- **Autenticación y registro:** contraseñas con hash, sesión con cookie, `/login` con correo/contraseña y cuentas demo restringidas por `es_demo`; `/registro` para candidato y empresa con términos y consentimiento.
- **Migración:** `backend/migrate_db.py` actualiza bases existentes; `schema.sql` y `seed.sql` cubren instalaciones nuevas; `reset_demo.py` restaura la demo.
- **Matching v2:** evalúa jornada y modalidad, no regala puntos por datos ausentes, incorpora necesidades esenciales, devuelve desglose por criterio, confianza y versión; recalcula postulaciones al cambiar perfil o vacante.
- **Accesibilidad verificable:** distinción entre declarada y verificada, con evidencia y fecha; consentimiento revocable para compartir necesidades; el teléfono no se comparte.
- **Integridad:** transacciones en perfil, vacante y postulaciones; validación de enums, rangos y campos; errores JSON; 404 real para `/api/*`.
- **Ciclo completo:** estados de postulación con historial y feedback, retiro por parte del candidato, notificaciones internas, edición/cierre/reapertura de vacantes y conteo de postulantes.
- **Catálogo:** búsqueda, filtros por ciudad/modalidad/jornada/accesibilidad y paginación.
- **Accesibilidad:** contraste de textos pequeños, foco con halo, alto contraste reescrito, zoom hasta 200 %, TTS detenido al navegar, errores de formulario asociados y copia de ayuda actualizada.
- **Pruebas:** más de 25 pruebas (`pytest`) entre unitarias de matching, API y E2E con Playwright; ejecución limpia verificada.
- **Documentación:** README reescrito, `docs/DEMO.md` y `docs/ACCESIBILIDAD.md`.

**Cómo se está ejecutando actualmente:**

```powershell
cd backend
python app.py
# Abrir http://127.0.0.1:5000
```

El servidor de Flask está corriendo en el puerto 5000 con `debug` desactivado por defecto. El frontend ya está compilado, por lo que no hace falta levantar Vite para la demo integrada.

---

## 3. Lo que hace falta

### 3.1 Prioridad alta (antes de entregar / demostrar)

1. **Probar la instalación desde cero.** Ejecutar `init_db.py` en una base limpia o documentar que se usa `setup_db.py`; confirmar que el esquema y el seed se cargan sin errores.
2. **Revisión manual de accesibilidad.** Probar con teclado y con un lector de pantalla real (NVDA o Narrador de Windows), revisar orden de foco, anuncios y contraste. Idealmente pasar axe DevTools o Lighthouse.
3. **Revisar diseño responsive en móvil.** ✅ Verificado a 390 px en selección de rol, inicio y emparejamiento; pendiente una pasada a 360 px y en dispositivos físicos.
4. **Decidir qué hacer con la postulación de prueba.** Si se quiere una base “limpia”, eliminar la fila de `postulaciones` creada durante las pruebas.
5. **Limpiar archivo temporal.** ✅ Archivo `_pdf_texto.txt` eliminado de la raíz del proyecto.
6. **Añadir un README de instalación.** ✅ Creado `README.md` en la raíz con instrucciones completas de instalación, configuración, base de datos y ejecución.

### 3.2 Prioridad media (completar el MVP)

1. ✅ **Motor de emparejamiento v2:** jornada y modalidad evaluadas, desglose visible, necesidades esenciales, confianza y recálculo.
2. ✅ **Catálogo con filtros:** búsqueda, ciudad, modalidad, jornada, accesibilidad y paginación.
3. ✅ **Gestión de vacantes:** editar, cerrar, reabrir y contar postulantes.
4. ✅ **Estados de postulación:** transiciones, feedback, historial, retiro y notificaciones.
5. ✅ **Competencias en el ranking de candidatos.**
6. ✅ **Autenticación y registro:** correo/contraseña, hash, sesión y cuentas demo restringidas. La recuperación por correo queda como trabajo futuro.
7. ✅ **Validaciones y errores:** validación en servidor, transacciones, respuestas JSON y 404 de API.
8. ✅ **Pruebas automatizadas:** pytest para matching/API y Playwright para flujos E2E.

### 3.3 Prioridad baja / fases posteriores del documento

Estas funcionalidades aparecen en el diseño conceptual del PDF, pero corresponden a fases 2 y 3, no al MVP actual:

- Acompañamiento post-contratación a 1, 3 y 6 meses.
- Diagnóstico de accesibilidad del puesto con informe y costo estimado de ajustes.
- Reconocimiento de competencias y equivalencia de títulos extranjeros.
- Canal WhatsApp y chatbot 24/7.
- Mensajería, foros y notificaciones externas por correo o WhatsApp (las notificaciones internas ya existen).
- Reportería de impacto (ODS 8 y 10), tableros para empresas y gobiernos.
- Formación y certificación “Empresa inclusiva”.
- API pública para ATS, arquitectura multi-tenant y multilingüismo.
- Auditoría automática de sesgos y supervisión humana formal del algoritmo.
- Modo ligero de bajo consumo de datos y funcionamiento parcial sin conexión.
- Traducción a otros idiomas y lectura fácil como versión independiente.

### 3.4 Producción y seguridad

- ✅ `debug` desactivado por defecto; falta sustituir Flask por Waitress/Gunicorn en producción.
- ✅ `SameSite=Lax` y `HttpOnly`; `Secure` configurable por entorno. En producción falta HTTPS.
- ✅ `.env` fuera de control de versiones y `SECRET_KEY` obligatoria.
- ✅ Validación de permisos, errores 500 JSON y límite simple de intentos de login. Pendiente CSRF por token y rate limiting distribuido.
- ✅ Política de privacidad, consentimiento revocable y minimización de datos de accesibilidad.
- ✅ `migrate_db.py` y `reset_demo.py`; pendiente respaldos automáticos.

---

## 4. Riesgos y observaciones

| Riesgo | Impacto |
|---|---|
| La sesión demo depende de cuentas públicas | Cualquiera puede usar las cuentas demo; las cuentas reales no se pueden suplantar. Aceptable para demo. |
| El backend corre con el servidor de desarrollo | No apto para exposición pública sin WSGI. |
| Dependencia de MySQL local encendido | Si el servicio se detiene, la app no carga datos. |
| El build de frontend no forma parte de un pipeline | Cambios en React requieren `npm run build` antes de servir con Flask. |
| La verificación de accesibilidad es demostrativa | No existe panel de auditoría ni evidencia subida por terceros. |
| La accesibilidad no tiene auditoría formal completa | Puede haber barreras no detectadas con lector de pantalla o axe. |
| Sin recuperación de contraseña | Una persona registrada que olvide su clave depende del equipo. |

---

## 5. Próximo paso recomendado

1. Hacer la revisión manual de accesibilidad con teclado, NVDA y axe.
2. Probar la instalación limpia con `init_db.py`/`setup_db.py` y `migrate_db.py`.
3. Verificar en dispositivos físicos y a 320 px.
4. Decidir si se implementa recuperación de contraseña o se documenta como fuera de alcance.
5. Preparar la presentación con `docs/DEMO.md`.

---

## 6. Archivos clave

| Archivo | Rol |
|---|---|
| `PLAN.md` | Plan técnico original y criterios de aceptación |
| `backend/app.py` | API Flask, autenticación, matching, postulaciones y SPA |
| `backend/db.py` | Conexión, helpers de MySQL y transacciones |
| `backend/matching.py` | Motor de emparejamiento explicable v2 |
| `backend/schema.sql` | DDL de la base de datos |
| `backend/seed.sql` | Datos demo |
| `backend/init_db.py` | Inicialización interactiva de la base |
| `backend/setup_db.py` | Inicialización con credenciales root |
| `backend/migrate_db.py` | Migración de bases existentes |
| `backend/reset_demo.py` | Restauración de la demo |
| `backend/tests/` | Pruebas unitarias y de API |
| `backend/.env` | Configuración local (no versionar) |
| `frontend/src/App.jsx` | Enrutamiento principal |
| `frontend/src/pages/` | 15 páginas de la aplicación |
| `frontend/src/components/` | Layout, navegación, accesibilidad, iconos y guardas de rol |
| `frontend/src/contexts/` | Sesión y preferencias de accesibilidad |
| `frontend/src/hooks/` | TTS/ASR y anuncios de ruta |
| `tests/e2e/` | Pruebas Playwright de los flujos principales |
| `docs/DEMO.md` | Guion de demostración |
| `docs/ACCESIBILIDAD.md` | Checklist y pendientes de accesibilidad |
| `frontend/dist/` | Build de producción servido por Flask |
