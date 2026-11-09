import os
from contextlib import contextmanager
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "inclusivo_user"),
            password=os.getenv("DB_PASSWORD", "Inclusivo2026!"),
            database=os.getenv("DB_NAME", "inclusivo_db"),
        )
        return connection
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        raise e


def query_db(query, args=(), one=False):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, args)
        rv = cursor.fetchall()
        return (rv[0] if rv else None) if one else rv
    finally:
        cursor.close()
        conn.close()


def modify_db(query, args=()):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query, args)
        conn.commit()
        return cursor.lastrowid
    except Error as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()


@contextmanager
def transaction(dictionary=False):
    """Transacción explícita para operaciones de varios pasos.

    Uso:
        with transaction() as (conn, cur):
            cur.execute(...)
            cur.execute(...)
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=dictionary)
    try:
        yield conn, cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

