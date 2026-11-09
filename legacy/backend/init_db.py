import os
import getpass
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def dividir_sql(sql):
    """Separa un archivo .sql en sentencias ejecutables.

    Los archivos del proyecto no usan procedimientos almacenados ni DELIMITER,
    por lo que basta con quitar comentarios de línea y dividir por ';'.
    """
    lineas = [
        linea for linea in sql.splitlines()
        if not linea.strip().startswith("--")
    ]
    return [s.strip() for s in "\n".join(lineas).split(";") if s.strip()]


def ejecutar_archivo(cursor, conn, ruta):
    with open(ruta, "r", encoding="utf-8") as archivo:
        sentencias = dividir_sql(archivo.read())

    for sentencia in sentencias:
        # La base y el usuario ya se crearon con root; el usuario de la app
        # solo necesita crear tablas y cargar datos dentro de inclusivo_db.
        if sentencia.upper().startswith(("CREATE DATABASE", "USE ")):
            continue
        try:
            cursor.execute(sentencia)
            conn.commit()
        except Exception as e:
            print(f"  Nota: no se pudo ejecutar una sentencia ({e}).")


def init_database():
    print("=== Inicialización de Base de Datos MySQL para IncluTrabajo AI ===")
    host = os.getenv("DB_HOST", "127.0.0.1")
    port = int(os.getenv("DB_PORT", 3306))
    db_name = os.getenv("DB_NAME", "inclusivo_db")
    db_user = os.getenv("DB_USER", "inclusivo_user")
    db_pass = os.getenv("DB_PASSWORD", "Inclusivo2026!")

    root_user = input("Usuario root de MySQL [root]: ").strip() or "root"
    root_pass = getpass.getpass(f"Contraseña para {root_user}@{host}: ")

    try:
        conn = mysql.connector.connect(
            host=host,
            port=port,
            user=root_user,
            password=root_pass
        )
        cursor = conn.cursor()
        print("Conectado a MySQL como root con éxito.")

        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS {db_name} "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        )
        print(f"Base de datos '{db_name}' verificada/creada.")

        cursor.execute(
            f"CREATE USER IF NOT EXISTS '{db_user}'@'localhost' "
            f"IDENTIFIED BY '{db_pass}';"
        )
        cursor.execute(
            f"GRANT ALL PRIVILEGES ON {db_name}.* TO '{db_user}'@'localhost';"
        )
        cursor.execute("FLUSH PRIVILEGES;")
        print(f"Usuario '{db_user}'@'localhost' configurado con privilegios sobre '{db_name}'.")

        cursor.close()
        conn.close()

        # Conectar con el usuario dedicado y ejecutar schema y seed.
        app_conn = mysql.connector.connect(
            host=host,
            port=port,
            user=db_user,
            password=db_pass,
            database=db_name
        )
        app_cursor = app_conn.cursor()

        print("Aplicando esquema (schema.sql)...")
        ejecutar_archivo(app_cursor, app_conn, os.path.join(BASE_DIR, "schema.sql"))

        print("Cargando datos iniciales (seed.sql)...")
        ejecutar_archivo(app_cursor, app_conn, os.path.join(BASE_DIR, "seed.sql"))

        app_cursor.close()
        app_conn.close()
        print("\n¡Base de datos inicializada y lista para usar!")

    except Exception as e:
        print(f"\nError durante la inicialización de la base de datos: {e}")
        raise


if __name__ == "__main__":
    init_database()
