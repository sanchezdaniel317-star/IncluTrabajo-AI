"""Restaura la base demo a su estado inicial.

Borra datos transaccionales y vuelve a cargar seed.sql. Útil antes de una
demostración o evaluación.

Uso:
    cd backend
    python reset_demo.py
"""
import os
import mysql.connector
from dotenv import load_dotenv

from init_db import dividir_sql

load_dotenv()

TABLAS = [
    "notificaciones",
    "postulacion_historial",
    "postulaciones",
    "vacante_requisitos",
    "vacante_accesibilidad",
    "vacantes",
    "candidato_competencias",
    "candidato_necesidades",
    "candidatos",
    "empresas",
    "perfiles",
    "competencias",
    "necesidades_accesibilidad",
]


def main():
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "inclusivo_user"),
        password=os.getenv("DB_PASSWORD", "Inclusivo2026!"),
        database=os.getenv("DB_NAME", "inclusivo_db"),
        autocommit=True,
    )
    cur = conn.cursor()
    try:
        print("Eliminando datos de la demo...")
        cur.execute("SET FOREIGN_KEY_CHECKS = 0")
        for tabla in TABLAS:
            cur.execute(f"TRUNCATE TABLE `{tabla}`")
            print(f"  - {tabla}")
        cur.execute("SET FOREIGN_KEY_CHECKS = 1")

        ruta = os.path.join(os.path.dirname(__file__), "seed.sql")
        with open(ruta, "r", encoding="utf-8") as archivo:
            sentencias = dividir_sql(archivo.read())
        print("Cargando datos iniciales...")
        for sentencia in sentencias:
            if sentencia.upper().startswith(("CREATE DATABASE", "USE ")):
                continue
            cur.execute(sentencia)
        print("\nDemo restaurada. Cuentas: ana.torres@demo.com, carlos.gomez@demo.com,")
        print("contacto@techincluye.com y rrhh@comercialcaribe.com.")
        print("Contraseña común: Demo2026!")
    except Exception as exc:
        print(f"Error al restaurar la demo: {exc}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
