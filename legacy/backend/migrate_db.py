"""Migración idempotente para la base existente de IncluTrabajo AI.

Uso:
    cd backend
    python migrate_db.py

Añade autenticación, consentimiento, verificación de accesibilidad,
historial de postulaciones y notificaciones sin borrar datos.
"""
import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

DEMO_PASSWORD_HASH = (
    "scrypt:32768:8:1$uaahX0i2P14oW7Us$"
    "a647c156a4ab66b2c4ff8ac1b9f0b1e42c551e7c08ed5d03eae3d7939b7beb79"
    "3783fbca22323e82fd920156b3c18f109bbe30fa6eaed550cf8c4b96981ca8a6"
)


def columnas(cursor, tabla):
    cursor.execute(f"SHOW COLUMNS FROM `{tabla}`")
    return {fila[0] for fila in cursor.fetchall()}


def indices(cursor, tabla):
    cursor.execute(f"SHOW INDEX FROM `{tabla}`")
    return {fila[2] for fila in cursor.fetchall()}


def agregar_columna(cursor, tabla, columna, definicion):
    if columna in columnas(cursor, tabla):
        print(f"  = {tabla}.{columna} ya existe")
        return
    cursor.execute(f"ALTER TABLE `{tabla}` ADD COLUMN `{columna}` {definicion}")
    print(f"  + {tabla}.{columna}")


def agregar_indice(cursor, tabla, nombre, definicion):
    if nombre in indices(cursor, tabla):
        print(f"  = índice {nombre} ya existe")
        return
    cursor.execute(f"ALTER TABLE `{tabla}` ADD INDEX `{nombre}` {definicion}")
    print(f"  + índice {nombre}")


def main():
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "inclusivo_user"),
        password=os.getenv("DB_PASSWORD", "Inclusivo2026!"),
        database=os.getenv("DB_NAME", "inclusivo_db"),
        autocommit=False,
    )
    cur = conn.cursor()
    try:
        print("Migrando perfiles...")
        agregar_columna(cur, "perfiles", "password_hash", "VARCHAR(255) NULL AFTER email")
        agregar_columna(cur, "perfiles", "es_demo", "BOOLEAN NOT NULL DEFAULT FALSE")
        agregar_columna(cur, "perfiles", "activo", "BOOLEAN NOT NULL DEFAULT TRUE")
        agregar_columna(
            cur, "perfiles", "actualizado_en",
            "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        )
        cur.execute("UPDATE perfiles SET es_demo = TRUE WHERE id IN (1, 2, 3, 4)")
        cur.execute(
            "UPDATE perfiles SET password_hash = %s WHERE password_hash IS NULL",
            (DEMO_PASSWORD_HASH,),
        )
        cur.execute(
            "SELECT COUNT(*) FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'perfiles' "
            "AND COLUMN_NAME = 'password_hash' AND IS_NULLABLE = 'YES'"
        )
        if cur.fetchone()[0]:
            cur.execute("ALTER TABLE perfiles MODIFY password_hash VARCHAR(255) NOT NULL")
            print("  + password_hash ahora es NOT NULL")

        print("Migrando candidatos...")
        agregar_columna(cur, "candidatos", "consentimiento_datos", "BOOLEAN NOT NULL DEFAULT FALSE")
        agregar_columna(cur, "candidatos", "consentimiento_fecha", "DATETIME NULL")
        agregar_columna(cur, "candidatos", "consentimiento_version", "VARCHAR(20) NULL")
        cur.execute(
            "UPDATE candidatos SET consentimiento_datos = TRUE, "
            "consentimiento_fecha = COALESCE(consentimiento_fecha, NOW()), "
            "consentimiento_version = COALESCE(consentimiento_version, '2026-01') "
            "WHERE perfil_id IN (1, 2)"
        )

        print("Migrando necesidades de candidatos...")
        agregar_columna(cur, "candidato_necesidades", "critica", "BOOLEAN NOT NULL DEFAULT FALSE")
        cur.execute(
            "UPDATE candidato_necesidades SET critica = TRUE "
            "WHERE (candidato_id = 1 AND necesidad_id = 4) "
            "OR (candidato_id = 2 AND necesidad_id = 7)"
        )

        print("Migrando accesibilidad de vacantes...")
        agregar_columna(cur, "vacante_accesibilidad", "verificada", "BOOLEAN NOT NULL DEFAULT FALSE")
        agregar_columna(cur, "vacante_accesibilidad", "evidencia", "VARCHAR(255) NULL")
        agregar_columna(cur, "vacante_accesibilidad", "verificada_en", "DATETIME NULL")
        cur.execute(
            "UPDATE vacante_accesibilidad SET verificada = TRUE, "
            "evidencia = COALESCE(evidencia, 'Verificación demo del puesto'), "
            "verificada_en = COALESCE(verificada_en, NOW()) "
            "WHERE (vacante_id IN (1, 2) AND necesidad_id IN (1, 4, 7))"
        )

        print("Migrando postulaciones...")
        agregar_columna(cur, "postulaciones", "feedback", "TEXT NULL")
        agregar_columna(
            cur, "postulaciones", "actualizado_en",
            "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        )

        print("Creando tablas de historial y notificaciones...")
        cur.execute("""
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        cur.execute("""
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        print("  + postulacion_historial y notificaciones")

        # Historial inicial para postulaciones que ya existían.
        cur.execute("""
            INSERT INTO postulacion_historial (postulacion_id, estado_anterior, estado_nuevo, comentario)
            SELECT p.id, NULL, p.estado, 'Estado inicial migrado'
            FROM postulaciones p
            WHERE NOT EXISTS (
                SELECT 1 FROM postulacion_historial h WHERE h.postulacion_id = p.id
            )
        """)

        print("Creando índices...")
        agregar_indice(cur, "vacantes", "idx_vacantes_activa_ciudad_modalidad", "(activa, ciudad, modalidad)")
        agregar_indice(cur, "postulaciones", "idx_postulaciones_vacante", "(vacante_id)")
        agregar_indice(cur, "postulacion_historial", "idx_historial_postulacion", "(postulacion_id)")
        agregar_indice(cur, "notificaciones", "idx_notificaciones_perfil_leida", "(perfil_id, leida)")

        conn.commit()
        print("\nMigración completada correctamente.")
    except Exception as exc:
        conn.rollback()
        print(f"\nError en la migración: {exc}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
