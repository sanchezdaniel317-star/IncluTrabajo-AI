-- Datos iniciales demo para IncluTrabajo AI

USE inclusivo_db;

-- 1. Competencias
INSERT INTO competencias (id, nombre) VALUES
(1, 'atención al cliente'),
(2, 'excel'),
(3, 'ventas'),
(4, 'logística'),
(5, 'programación'),
(6, 'contabilidad'),
(7, 'manejo de personal'),
(8, 'inglés')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- 2. Necesidades de accesibilidad
INSERT INTO necesidades_accesibilidad (id, nombre, descripcion) VALUES
(1, 'rampa', 'Acceso físico sin escalones o con rampa habilitada'),
(2, 'ascensor', 'Edificio con ascensor operativo para movilidad reducida'),
(3, 'baño accesible', 'Baño adaptado para personas en silla de ruedas'),
(4, 'lector de pantalla', 'Sistemas y software compatibles con lectores de pantalla'),
(5, 'lenguaje sencillo', 'Documentación y guías en lectura fácil y lenguaje claro'),
(6, 'horario flexible', 'Flexibilidad horaria compatible con responsabilidades de cuidado o salud'),
(7, 'teletrabajo', 'Modalidad de trabajo remoto o híbrido'),
(8, 'intérprete de señas', 'Apoyo con intérprete en reuniones clave o canales accesibles')
ON DUPLICATE KEY UPDATE descripcion=descripcion;

-- 3. Perfiles demo (Candidatos y Empresas)
-- Contraseña de todas las cuentas demo: Demo2026!
INSERT INTO perfiles (id, rol, nombre, email, password_hash, es_demo, activo) VALUES
(1, 'candidato', 'Ana Torres', 'ana.torres@demo.com', 'scrypt:32768:8:1$uaahX0i2P14oW7Us$a647c156a4ab66b2c4ff8ac1b9f0b1e42c551e7c08ed5d03eae3d7939b7beb793783fbca22323e82fd920156b3c18f109bbe30fa6eaed550cf8c4b96981ca8a6', TRUE, TRUE),
(2, 'candidato', 'Carlos Gómez', 'carlos.gomez@demo.com', 'scrypt:32768:8:1$uaahX0i2P14oW7Us$a647c156a4ab66b2c4ff8ac1b9f0b1e42c551e7c08ed5d03eae3d7939b7beb793783fbca22323e82fd920156b3c18f109bbe30fa6eaed550cf8c4b96981ca8a6', TRUE, TRUE),
(3, 'empresa', 'TechIncluye S.A.S.', 'contacto@techincluye.com', 'scrypt:32768:8:1$uaahX0i2P14oW7Us$a647c156a4ab66b2c4ff8ac1b9f0b1e42c551e7c08ed5d03eae3d7939b7beb793783fbca22323e82fd920156b3c18f109bbe30fa6eaed550cf8c4b96981ca8a6', TRUE, TRUE),
(4, 'empresa', 'Comercial del Caribe', 'rrhh@comercialcaribe.com', 'scrypt:32768:8:1$uaahX0i2P14oW7Us$a647c156a4ab66b2c4ff8ac1b9f0b1e42c551e7c08ed5d03eae3d7939b7beb793783fbca22323e82fd920156b3c18f109bbe30fa6eaed550cf8c4b96981ca8a6', TRUE, TRUE)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- 4. Candidatos
INSERT INTO candidatos (perfil_id, ciudad, telefono, experiencia_anios, modalidad_pref, jornada_pref, salario_min, consentimiento_datos, consentimiento_fecha, consentimiento_version) VALUES
(1, 'Cartagena', '3001234567', 2, 'hibrido', 'completa', 1800000.00, TRUE, NOW(), '2026-01'),
(2, 'Bogotá', '3109876543', 4, 'remoto', 'completa', 2500000.00, TRUE, NOW(), '2026-01')
ON DUPLICATE KEY UPDATE ciudad=ciudad;

-- Competencias de Ana Torres (id 1)
INSERT INTO candidato_competencias (candidato_id, competencia_id) VALUES
(1, 1), (1, 2)
ON DUPLICATE KEY UPDATE candidato_id=candidato_id;

-- Necesidades de Ana Torres (id 1) - requiere lector de pantalla y horario flexible
INSERT INTO candidato_necesidades (candidato_id, necesidad_id, critica) VALUES
(1, 4, TRUE), (1, 6, FALSE)
ON DUPLICATE KEY UPDATE candidato_id=candidato_id;

-- Competencias de Carlos Gómez (id 2)
INSERT INTO candidato_competencias (candidato_id, competencia_id) VALUES
(2, 5), (2, 8)
ON DUPLICATE KEY UPDATE candidato_id=candidato_id;

-- Necesidades de Carlos Gómez (id 2) - teletrabajo y rampa
INSERT INTO candidato_necesidades (candidato_id, necesidad_id, critica) VALUES
(2, 1, FALSE), (2, 7, TRUE)
ON DUPLICATE KEY UPDATE candidato_id=candidato_id;

-- 5. Empresas
INSERT INTO empresas (perfil_id, sector, ciudad) VALUES
(3, 'Tecnología / Software', 'Cartagena'),
(4, 'Retail / Comercio', 'Barranquilla')
ON DUPLICATE KEY UPDATE sector=sector;

-- 6. Vacantes
INSERT INTO vacantes (id, empresa_id, cargo, descripcion, ciudad, modalidad, jornada, salario, activa) VALUES
(1, 3, 'Auxiliar Administrativo Inclusivo', 'Apoyo en gestión de documentos, atención telefónica y cruce de datos en Excel. Puesto con estaciones adaptadas.', 'Cartagena', 'hibrido', 'completa', 1900000.00, TRUE),
(2, 3, 'Desarrollador Junior Frontend', 'Desarrollo de interfaces accesibles WCAG 2.2 con React. Soporte para teletrabajo y equipos adaptados.', 'Cartagena', 'remoto', 'completa', 3200000.00, TRUE),
(3, 4, 'Asesor de Atención al Cliente', 'Atención de solicitudes de clientes en canales digitales y telefónicos. Horarios flexibles para cuidadores.', 'Barranquilla', 'presencial', 'medio_tiempo', 1500000.00, TRUE)
ON DUPLICATE KEY UPDATE cargo=cargo;

-- Requisitos de vacantes (competencias)
INSERT INTO vacante_requisitos (vacante_id, competencia_id) VALUES
(1, 1), (1, 2), -- Auxiliar: atención al cliente, excel
(2, 5), (2, 8), -- Dev: programación, inglés
(3, 1)          -- Asesor: atención al cliente
ON DUPLICATE KEY UPDATE vacante_id=vacante_id;

-- Accesibilidad de vacantes
INSERT INTO vacante_accesibilidad (vacante_id, necesidad_id, verificada, evidencia, verificada_en) VALUES
(1, 4, TRUE, 'Diagnóstico de accesibilidad digital 2026', NOW()),
(1, 6, FALSE, NULL, NULL),
(1, 1, TRUE, 'Visita técnica al puesto', NOW()),
(2, 7, TRUE, 'Política de teletrabajo verificada', NOW()),
(2, 5, FALSE, NULL, NULL),
(2, 4, TRUE, 'Revisión con lector de pantalla', NOW()),
(3, 6, FALSE, NULL, NULL),
(3, 3, FALSE, NULL, NULL)
ON DUPLICATE KEY UPDATE vacante_id=vacante_id;

-- 7. Postulación demo para mostrar seguimiento y ranking de empresa
INSERT INTO postulaciones
(id, candidato_id, vacante_id, estado, score, explicacion, feedback, fecha)
VALUES
(1, 1, 1, 'En revisión', 100,
 '{"score":100,"nivel":"Alta","compatible":true,"razones":["Coinciden todas las competencias requeridas.","El puesto cubre tus necesidades de accesibilidad."],"faltantes":[]}',
 'Tu perfil fue revisado. El equipo continuará con la entrevista.', NOW())
ON DUPLICATE KEY UPDATE estado = estado;

INSERT INTO postulacion_historial
(postulacion_id, estado_anterior, estado_nuevo, comentario, cambiado_por)
SELECT 1, NULL, 'Postulado', 'Postulación demo', 1
WHERE NOT EXISTS (
  SELECT 1 FROM postulacion_historial
  WHERE postulacion_id = 1 AND estado_nuevo = 'Postulado'
);

INSERT INTO postulacion_historial
(postulacion_id, estado_anterior, estado_nuevo, comentario, cambiado_por)
SELECT 1, 'Postulado', 'En revisión', 'Tu perfil fue revisado.', 3
WHERE NOT EXISTS (
  SELECT 1 FROM postulacion_historial
  WHERE postulacion_id = 1 AND estado_nuevo = 'En revisión'
);

INSERT INTO notificaciones (perfil_id, tipo, titulo, mensaje, url)
SELECT 3, 'nueva_postulacion', 'Nueva postulación recibida',
       'Ana Torres se postuló a Auxiliar Administrativo Inclusivo.',
       '/empresa/vacantes/1/candidatos'
WHERE NOT EXISTS (
  SELECT 1 FROM notificaciones WHERE perfil_id = 3 AND tipo = 'nueva_postulacion'
);

INSERT INTO notificaciones (perfil_id, tipo, titulo, mensaje, url)
SELECT 1, 'estado_postulacion', 'Tu postulación cambió de estado',
       'Tu postulación a Auxiliar Administrativo Inclusivo está en “En revisión”.',
       '/postulaciones'
WHERE NOT EXISTS (
  SELECT 1 FROM notificaciones WHERE perfil_id = 1 AND tipo = 'estado_postulacion'
);
