import os
import getpass
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

def auto_init():
    host = os.getenv("DB_HOST", "127.0.0.1")
    port = int(os.getenv("DB_PORT", 3306))
    db_name = os.getenv("DB_NAME", "inclusivo_db")
    db_user = os.getenv("DB_USER", "inclusivo_user")
    db_pass = os.getenv("DB_PASSWORD", "Inclusivo2026!")

    root_user = os.getenv("MYSQL_ROOT_USER", "root")
    root_pass = os.getenv("MYSQL_ROOT_PASSWORD")
    if root_pass is None:
        root_pass = getpass.getpass(f"Contraseña de {root_user}@{host} para crear la base: ")

    print(f"Conectando como {root_user}@{host}...")
    conn = mysql.connector.connect(host=host, port=port, user=root_user, password=root_pass)
    cursor = conn.cursor()

    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    cursor.execute(f"CREATE USER IF NOT EXISTS '{db_user}'@'localhost' IDENTIFIED BY '{db_pass}';")
    cursor.execute(f"GRANT ALL PRIVILEGES ON {db_name}.* TO '{db_user}'@'localhost';")
    cursor.execute("FLUSH PRIVILEGES;")
    cursor.close()
    conn.close()

    app_conn = mysql.connector.connect(host=host, port=port, user=db_user, password=db_pass, database=db_name)
    app_cursor = app_conn.cursor()

    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    # Ejecutar sentencias una por una separadas por ;
    for statement in schema_sql.split(";"):
        stmt = statement.strip()
        if stmt:
            try:
                app_cursor.execute(stmt)
                app_conn.commit()
            except Exception as e:
                print(f"Nota en schema statement: {e}")

    seed_path = os.path.join(os.path.dirname(__file__), "seed.sql")
    with open(seed_path, "r", encoding="utf-8") as f:
        seed_sql = f.read()

    for statement in seed_sql.split(";"):
        stmt = statement.strip()
        if stmt:
            try:
                app_cursor.execute(stmt)
                app_conn.commit()
            except Exception as e:
                print(f"Nota en seed statement: {e}")

    app_cursor.close()
    app_conn.close()
    print("¡Base de datos y tablas creadas y pobladas con éxito!")

if __name__ == "__main__":
    auto_init()
