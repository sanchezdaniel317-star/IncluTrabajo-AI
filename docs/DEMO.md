# Guion de demostración — IncluTrabajo AI

Duración sugerida: 8–10 minutos.

## Antes de empezar

```powershell
cd backend
python migrate_db.py     # solo si la base es antigua
python reset_demo.py     # deja datos limpios
cd ..\frontend
npm run build
cd ..\backend
python app.py
```

Abre `http://127.0.0.1:5000` y pulsa `Ctrl + F5`.

## 1. Bienvenida y propuesta (1 min)

- Muestra `/`: enfoque universal, vista previa de una coincidencia y bloques para personas y empresas.
- Señala que el acceso es gratuito para personas y que las empresas tienen panel propio.

## 2. Registro y login (2 min)

- Entra a `/registro`.
- Muestra el selector “Busco empleo / Soy empresa”.
- Señala el consentimiento de datos sensibles y el enlace a la política de privacidad.
- Vuelve a `/login`.
- Muestra el formulario con correo y contraseña y el recuadro de cuentas demo.
- Entra con un clic como **Ana Torres**.
- Menciona que la contraseña demo es `Demo2026!` y que las cuentas demo no permiten suplantar usuarios reales.

## 3. Perfil y consentimiento (1 min)

- Ve a **Mi Perfil**.
- Muestra el indicador de perfil completo.
- Marca una necesidad como **esencial**.
- Activa o desactiva el consentimiento para compartir accesibilidad.
- Guarda y señala que el score se recalcula.

## 4. Emparejamiento explicable (2 min)

- Abre **Emparejamiento IA**.
- Muestra el desglose de las cuatro dimensiones con sus puntajes.
- Explica el caso “No compatible”: una necesidad esencial no cubierta.
- Abre una vacante y muestra el checklist:
  - **Verificada**: con evidencia registrada.
  - **Declarada por la empresa**: sin evidencia.
- Señala el botón “Ya estás postulado” cuando corresponde.

## 5. Catálogo (1 min)

- Abre **Vacantes**.
- Filtra por ciudad, modalidad o ajuste de accesibilidad.
- Muestra la paginación y el estado público (sin sesión se puede explorar, pero no postular).

## 6. Seguimiento del candidato (1 min)

- Abre **Mis Postulaciones**.
- Muestra estado, feedback, línea de tiempo y opción de retirar.
- Abre **Avisos** y muestra la notificación de cambio de estado.

## 7. Panel de empresa (2 min)

- Cambia de rol o inicia sesión como **TechIncluye S.A.S.**
- Muestra el panel: postulantes, editar, cerrar/reabrir.
- Abre **Ver candidatos**.
- Muestra el score actual, competencias, necesidades compartidas y el historial.
- Cambia el estado a **Entrevista**, deja un comentario y guarda.
- Vuelve a la cuenta de Ana y muestra la notificación y el historial actualizado.

## 8. Accesibilidad (1 min)

- Pulsa `Tab` desde el inicio: aparece “Saltar al contenido principal”.
- Sube el zoom a 200 % con `A+` y muestra el reflow.
- Activa **Alto contraste**.
- Pulsa **Leer página** y luego cámbiala de sección para demostrar que la lectura se detiene.
- En el perfil, muestra el botón de dictado (Chrome/Edge).

## 9. Cierre

- Recuerda la política de privacidad y el consentimiento revocable.
- Presenta las limitaciones como trabajo futuro: WhatsApp, verificación formal, acompañamiento post-contratación, multilingüismo, PWA y API para ATS.
