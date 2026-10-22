-- DDL para IncluTrabajo AI (MySQL)

CREATE DATABASE IF NOT EXISTS inclusivo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inclusivo_db;

-- Tabla de perfiles (Demo sin contraseñas)
CREATE TABLE IF NOT EXISTS perfiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol ENUM('candidato', 'empresa') NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    es_demo BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de candidatos
CREATE TABLE IF NOT EXISTS candidatos (
    perfil_id INT PRIMARY KEY,
    ciudad VARCHAR(100) NOT NULL,
    telefono VARCHAR(50),
    experiencia_anios INT DEFAULT 0,
    modalidad_pref VARCHAR(50) DEFAULT 'cualquiera',
    jornada_pref VARCHAR(50) DEFAULT 'completa',
    salario_min DECIMAL(12,2) DEFAULT 0.00,
    consentimiento_datos BOOLEAN NOT NULL DEFAULT FALSE,
    consentimiento_fecha DATETIME NULL,
    consentimiento_version VARCHAR(20) NULL,
    FOREIGN KEY (perfil_id) REFERENCES perfiles(id) ON DELETE CASCADE
);

-- Tabla de empresas
CREATE TABLE IF NOT EXISTS empresas (
    perfil_id INT PRIMARY KEY,
    sector VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    FOREIGN KEY (perfil_id) REFERENCES perfiles(id) ON DELETE CASCADE
);

-- Catálogo de competencias
CREATE TABLE IF NOT EXISTS competencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

-- Relación candidato - competencias
CREATE TABLE IF NOT EXISTS candidato_competencias (
    candidato_id INT,
    competencia_id INT,
    PRIMARY KEY (candidato_id, competencia_id),
    FOREIGN KEY (candidato_id) REFERENCES candidatos(perfil_id) ON DELETE CASCADE,
    FOREIGN KEY (competencia_id) REFERENCES competencias(id) ON DELETE CASCADE
);

-- Catálogo de necesidades de accesibilidad
CREATE TABLE IF NOT EXISTS necesidades_accesibilidad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT
);

-- Relación candidato - necesidades de accesibilidad
CREATE TABLE IF NOT EXISTS candidato_necesidades (
    candidato_id INT,
    necesidad_id INT,
    critica BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (candidato_id, necesidad_id),
    FOREIGN KEY (candidato_id) REFERENCES candidatos(perfil_id) ON DELETE CASCADE,
    FOREIGN KEY (necesidad_id) REFERENCES necesidades_accesibilidad(id) ON DELETE CASCADE
);

-- Vacantes
CREATE TABLE IF NOT EXISTS vacantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    cargo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    modalidad VARCHAR(50) NOT NULL,
    jornada VARCHAR(50) NOT NULL,
    salario DECIMAL(12,2) NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(perfil_id) ON DELETE CASCADE
);

-- Requisitos de competencias por vacante
CREATE TABLE IF NOT EXISTS vacante_requisitos (
    vacante_id INT,
    competencia_id INT,
    PRIMARY KEY (vacante_id, competencia_id),
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
    FOREIGN KEY (competencia_id) REFERENCES competencias(id) ON DELETE CASCADE
);

-- Checklist de accesibilidad del puesto por vacante
CREATE TABLE IF NOT EXISTS vacante_accesibilidad (
    vacante_id INT,
    necesidad_id INT,
    verificada BOOLEAN NOT NULL DEFAULT FALSE,
    evidencia VARCHAR(255) NULL,
    verificada_en DATETIME NULL,
    PRIMARY KEY (vacante_id, necesidad_id),
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE,
    FOREIGN KEY (necesidad_id) REFERENCES necesidades_accesibilidad(id) ON DELETE CASCADE
);

-- Postulaciones
CREATE TABLE IF NOT EXISTS postulaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidato_id INT NOT NULL,
    vacante_id INT NOT NULL,
    estado VARCHAR(50) DEFAULT 'Postulado',
    score INT NOT NULL,
    explicacion JSON,
    feedback TEXT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (candidato_id, vacante_id),
    FOREIGN KEY (candidato_id) REFERENCES candidatos(perfil_id) ON DELETE CASCADE,
    FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE
);

-- Historial de cambios de estado de una postulación
CREATE TABLE IF NOT EXISTS postulacion_historial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    postulacion_id INT NOT NULL,
    estado_anterior VARCHAR(50) NULL,
    estado_nuevo VARCHAR(50) NOT NULL,
    comentario TEXT NULL,
    cambiado_por INT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (cambiado_por) REFERENCES perfiles(id) ON DELETE SET NULL
);

-- Notificaciones internas (sin correo ni WhatsApp)
CREATE TABLE IF NOT EXISTS notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    perfil_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    url VARCHAR(255) NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (perfil_id) REFERENCES perfiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_vacantes_activa_ciudad_modalidad ON vacantes (activa, ciudad, modalidad);
CREATE INDEX idx_postulaciones_vacante ON postulaciones (vacante_id);
CREATE INDEX idx_historial_postulacion ON postulacion_historial (postulacion_id);
CREATE INDEX idx_notificaciones_perfil_leida ON notificaciones (perfil_id, leida);
