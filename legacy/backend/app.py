import os
import json
import re
import time
from datetime import timedelta
from functools import wraps
from urllib.parse import urlparse

from flask import Flask, g, jsonify, request, send_from_directory, session
from werkzeug.exceptions import HTTPException
from werkzeug.security import check_password_hash, generate_password_hash
from dotenv import load_dotenv

from db import modify_db, query_db, transaction
from matching import VERSION as MATCHING_VERSION, calcular_emparejamiento

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

MODALIDADES = {"presencial", "hibrido", "remoto"}
JORNADAS = {"completa", "medio_tiempo", "cualquiera"}
ROLES = {"candidato", "empresa"}
ESTADOS = ["Postulado", "En revisión", "Entrevista", "Contratado", "No seleccionado", "Retirada"]
ESTADOS_FINALES = {"Contratado", "No seleccionado", "Retirada"}
TRANSICIONES = {
    "Postulado": {"En revisión", "No seleccionado", "Entrevista"},
    "En revisión": {"Entrevista", "No seleccionado"},
    "Entrevista": {"Contratado", "No seleccionado"},
    "Contratado": set(),
    "No seleccionado": set(),
    "Retirada": set(),
}
CONSENT_VERSION = "2026-01"
DEMO_PASSWORD_HASH = (
    "scrypt:32768:8:1$uaahX0i2P14oW7Us$"
    "a647c156a4ab66b2c4ff8ac1b9f0b1e42c551e7c08ed5d03eae3d7939b7beb79"
    "3783fbca22323e82fd920156b3c18f109bbe30fa6eaed550cf8c4b96981ca8a6"
)

app = Flask(__name__, static_folder=None)
app.secret_key = os.getenv("SECRET_KEY")
if not app.secret_key:
    if os.getenv("FLASK_DEBUG", "0") == "1":
        app.secret_key = "solo-desarrollo-no-usar-en-produccion"
    else:
        raise RuntimeError("Falta SECRET_KEY en el entorno. Copia backend/.env.example a backend/.env.")
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.getenv("SESSION_COOKIE_SECURE", "0") == "1",
    PERMANENT_SESSION_LIFETIME=timedelta(days=30),
    MAX_CONTENT_LENGTH=2 * 1024 * 1024,
)
app.json.ensure_ascii = False

INTENTOS_LOGIN = {}


# ==================== UTILIDADES ====================

def _json_error(mensaje, codigo=400):
    return jsonify({"error": mensaje}), codigo


def _ok(mensaje, **extra):
    data = {"mensaje": mensaje}
    data.update(extra)
    return jsonify(data), 200


def _perfil_publico(perfil):
    return {
        "id": perfil["id"],
        "rol": perfil["rol"],
        "nombre": perfil["nombre"],
        "email": perfil["email"],
        "es_demo": bool(perfil.get("es_demo")),
    }


def _perfil_actual():
    perfil_id = session.get("perfil_id")
    if not perfil_id:
        return None
    perfil = query_db(
        "SELECT id, rol, nombre, email, es_demo, activo FROM perfiles WHERE id = %s",
        (perfil_id,),
        one=True,
    )
    if not perfil or not perfil["activo"]:
        session.clear()
        return None
    return perfil


def rol_requerido(rol=None):
    def decorador(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            perfil = _perfil_actual()
            if not perfil:
                return _json_error("Inicia sesión para continuar.", 401)
            if rol and perfil["rol"] != rol:
                return _json_error("No autorizado para esta sección.", 403)
            g.perfil = perfil
            return fn(*args, **kwargs)
        return wrapper
    return decorador


def _iniciar_sesion(perfil, recordar=False):
    session.clear()
    session["perfil_id"] = perfil["id"]
    session["rol"] = perfil["rol"]
    session.permanent = bool(recordar)


def _limitar_intentos(clave):
    ahora = time.time()
    intentos = [t for t in INTENTOS_LOGIN.get(clave, []) if ahora - t < 300]
    if len(intentos) >= 8:
        INTENTOS_LOGIN[clave] = intentos
        return False
    intentos.append(ahora)
    INTENTOS_LOGIN[clave] = intentos
    if len(INTENTOS_LOGIN) > 500:
        for k in list(INTENTOS_LOGIN)[:200]:
            INTENTOS_LOGIN.pop(k, None)
    return True


def _email_valido(email):
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email or ""))


def _texto(data, campo, maximo=500, minimo=0):
    valor = data.get(campo)
    if valor is None:
        return ""
    valor = str(valor).strip()
    if len(valor) < minimo or len(valor) > maximo:
        return None
    return valor


def _entero(data, campo, defecto=0, minimo=0, maximo=100):
    try:
        valor = int(data.get(campo, defecto))
    except (TypeError, ValueError):
        return None
    if valor < minimo or valor > maximo:
        return None
    return valor


def _decimal(data, campo, defecto=0.0, minimo=0.0, maximo=1_000_000_000):
    try:
        valor = float(data.get(campo, defecto))
    except (TypeError, ValueError):
        return None
    if valor < minimo or valor > maximo:
        return None
    return valor


def _ids_validos(lista, tabla):
    if not isinstance(lista, list):
        return []
    limpios = []
    for valor in lista:
        try:
            limpios.append(int(valor))
        except (TypeError, ValueError):
            continue
    if not limpios:
        return []
    placeholders = ",".join(["%s"] * len(limpios))
    existentes = query_db(
        f"SELECT id FROM {tabla} WHERE id IN ({placeholders})", tuple(limpios)
    )
    return [fila["id"] for fila in existentes]


def _notificar(cur, perfil_id, tipo, titulo, mensaje, url=None):
    cur.execute(
        "INSERT INTO notificaciones (perfil_id, tipo, titulo, mensaje, url) "
        "VALUES (%s, %s, %s, %s, %s)",
        (perfil_id, tipo, titulo, mensaje, url),
    )


def _historial(cur, postulacion_id, anterior, nuevo, comentario, cambiado_por):
    cur.execute(
        "INSERT INTO postulacion_historial "
        "(postulacion_id, estado_anterior, estado_nuevo, comentario, cambiado_por) "
        "VALUES (%s, %s, %s, %s, %s)",
        (postulacion_id, anterior, nuevo, comentario, cambiado_por),
    )


def _candidato_match_data(candidato_id):
    candidato = query_db(
        """
        SELECT c.*, p.nombre, p.email, p.activo
        FROM candidatos c JOIN perfiles p ON c.perfil_id = p.id
        WHERE c.perfil_id = %s
        """,
        (candidato_id,),
        one=True,
    )
    if not candidato:
        return None
    candidato["competencias"] = query_db(
        "SELECT c.id, c.nombre FROM competencias c "
        "JOIN candidato_competencias cc ON c.id = cc.competencia_id "
        "WHERE cc.candidato_id = %s",
        (candidato_id,),
    )
    candidato["necesidades"] = query_db(
        "SELECT n.id, n.nombre, n.descripcion, cn.critica "
        "FROM necesidades_accesibilidad n "
        "JOIN candidato_necesidades cn ON n.id = cn.necesidad_id "
        "WHERE cn.candidato_id = %s",
        (candidato_id,),
    )
    return candidato


def _adjuntar_detalle_vacantes(vacantes):
    if not vacantes:
        return vacantes
    ids = [v["id"] for v in vacantes]
    placeholders = ",".join(["%s"] * len(ids))
    requisitos = query_db(
        f"SELECT vr.vacante_id, c.id, c.nombre FROM vacante_requisitos vr "
        f"JOIN competencias c ON c.id = vr.competencia_id "
        f"WHERE vr.vacante_id IN ({placeholders})",
        tuple(ids),
    )
    accesibilidad = query_db(
        f"SELECT va.vacante_id, n.id, n.nombre, n.descripcion, va.verificada, "
        f"va.evidencia, va.verificada_en "
        f"FROM vacante_accesibilidad va "
        f"JOIN necesidades_accesibilidad n ON n.id = va.necesidad_id "
        f"WHERE va.vacante_id IN ({placeholders})",
        tuple(ids),
    )
    por_req, por_acc = {}, {}
    for fila in requisitos:
        por_req.setdefault(fila["vacante_id"], []).append(
            {"id": fila["id"], "nombre": fila["nombre"]}
        )
    for fila in accesibilidad:
        por_acc.setdefault(fila["vacante_id"], []).append({
            "id": fila["id"],
            "nombre": fila["nombre"],
            "descripcion": fila["descripcion"],
            "verificada": bool(fila["verificada"]),
            "evidencia": fila["evidencia"],
            "verificada_en": fila["verificada_en"],
        })
    for vacante in vacantes:
        vacante["requisitos"] = por_req.get(vacante["id"], [])
        vacante["accesibilidad"] = por_acc.get(vacante["id"], [])
        if "nombre_empresa" in vacante:
            vacante["empresa"] = {
                "nombre_empresa": vacante.get("nombre_empresa"),
                "sector": vacante.get("sector"),
            }
    return vacantes


def _vacante_match_data(vacante_id):
    vacante = query_db(
        """
        SELECT v.*, p.nombre AS nombre_empresa, e.sector
        FROM vacantes v
        JOIN empresas e ON v.empresa_id = e.perfil_id
        JOIN perfiles p ON e.perfil_id = p.id
        WHERE v.id = %s
        """,
        (vacante_id,),
        one=True,
    )
    if not vacante:
        return None
    _adjuntar_detalle_vacantes([vacante])
    return vacante


def _recalcular_postulaciones_candidato(candidato_id):
    candidato = _candidato_match_data(candidato_id)
    if not candidato:
        return
    postulaciones = query_db(
        "SELECT id, vacante_id FROM postulaciones WHERE candidato_id = %s",
        (candidato_id,),
    )
    if not postulaciones:
        return
    with transaction() as (conn, cur):
        for post in postulaciones:
            vacante = _vacante_match_data(post["vacante_id"])
            if not vacante:
                continue
            match = calcular_emparejamiento(candidato, vacante)
            cur.execute(
                "UPDATE postulaciones SET score = %s, explicacion = %s WHERE id = %s",
                (match["score"], json.dumps(match, ensure_ascii=False), post["id"]),
            )


def _recalcular_postulaciones_vacante(vacante_id):
    vacante = _vacante_match_data(vacante_id)
    if not vacante:
        return
    postulaciones = query_db(
        "SELECT id, candidato_id FROM postulaciones WHERE vacante_id = %s",
        (vacante_id,),
    )
    if not postulaciones:
        return
    with transaction() as (conn, cur):
        for post in postulaciones:
            candidato = _candidato_match_data(post["candidato_id"])
            if not candidato:
                continue
            match = calcular_emparejamiento(candidato, vacante)
            cur.execute(
                "UPDATE postulaciones SET score = %s, explicacion = %s WHERE id = %s",
                (match["score"], json.dumps(match, ensure_ascii=False), post["id"]),
            )


def _respuesta_notificacion(perfil, mensaje_empresa, url):
    return perfil, mensaje_empresa, url


# ==================== SEGURIDAD BÁSICA ====================

@app.before_request
def _verificar_origen():
    if request.method in ("POST", "PUT", "PATCH", "DELETE") and request.path.startswith("/api/"):
        origen = request.headers.get("Origin")
        if origen:
            host_origen = urlparse(origen).netloc
            permitidos = {request.host, "localhost:5173", "127.0.0.1:5173"}
            if host_origen not in permitidos:
                return _json_error("Origen no permitido.", 403)


@app.after_request
def _cabeceras_seguridad(response):
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), geolocation=()")
    return response


@app.errorhandler(HTTPException)
def _manejar_http(error):
    if request.path.startswith("/api/"):
        return _json_error(error.description or "Error en la solicitud.", error.code or 500)
    return error


@app.errorhandler(Exception)
def _manejar_error(error):
    if isinstance(error, HTTPException):
        return _manejar_http(error)
    app.logger.exception("Error no controlado")
    if request.path.startswith("/api/"):
        return _json_error("Ocurrió un error interno. Intenta de nuevo.", 500)
    raise error


# ==================== AUTENTICACIÓN ====================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "app": "IncluTrabajo AI API", "matching": MATCHING_VERSION})


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    recordar = bool(data.get("recordar"))
    if not email or not password:
        return _json_error("Ingresa tu correo y contraseña.", 400)
    if not _email_valido(email):
        return _json_error("Correo o contraseña incorrectos.", 401)
    clave = f"{request.remote_addr}:{email}"
    if not _limitar_intentos(clave):
        return _json_error("Demasiados intentos. Espera unos minutos.", 429)

    perfil = query_db(
        "SELECT id, rol, nombre, email, password_hash, es_demo, activo "
        "FROM perfiles WHERE email = %s",
        (email,),
        one=True,
    )
    if not perfil or not perfil["activo"] or not perfil["password_hash"]:
        return _json_error("Correo o contraseña incorrectos.", 401)
    if not check_password_hash(perfil["password_hash"], password):
        return _json_error("Correo o contraseña incorrectos.", 401)

    _iniciar_sesion(perfil, recordar)
    return jsonify({
        "mensaje": "Sesión iniciada con éxito",
        "perfil": _perfil_publico(perfil),
        "rol": perfil["rol"],
    }), 200


@app.route("/api/auth/demo", methods=["POST"])
def login_demo():
    data = request.get_json(silent=True) or {}
    try:
        perfil_id = int(data.get("perfil_id"))
    except (TypeError, ValueError):
        return _json_error("Perfil demo inválido.", 400)
    perfil = query_db(
        "SELECT id, rol, nombre, email, es_demo, activo FROM perfiles "
        "WHERE id = %s AND es_demo = TRUE AND activo = TRUE",
        (perfil_id,),
        one=True,
    )
    if not perfil:
        return _json_error("La cuenta demo no está disponible.", 404)
    _iniciar_sesion(perfil, False)
    return jsonify({
        "mensaje": "Sesión demo iniciada",
        "perfil": _perfil_publico(perfil),
        "rol": perfil["rol"],
    }), 200


@app.route("/api/auth/demo-cuentas", methods=["GET"])
@app.route("/api/sesion/opciones", methods=["GET"])
def demo_cuentas():
    perfiles = query_db(
        "SELECT id, rol, nombre, email FROM perfiles "
        "WHERE es_demo = TRUE AND activo = TRUE ORDER BY rol, id"
    )
    return jsonify(perfiles), 200


@app.route("/api/sesion", methods=["GET"])
def get_sesion():
    perfil = _perfil_actual()
    if not perfil:
        return jsonify({"perfil": None, "rol": None}), 200
    return jsonify({"perfil": _perfil_publico(perfil), "rol": perfil["rol"]}), 200


@app.route("/api/sesion", methods=["POST"])
def post_sesion():
    # Compatibilidad con el flujo demo anterior.
    return login_demo()


@app.route("/api/sesion", methods=["DELETE"])
@app.route("/api/auth/logout", methods=["POST"])
def delete_sesion():
    session.clear()
    return jsonify({"mensaje": "Sesión cerrada con éxito"}), 200


@app.route("/api/auth/registro", methods=["POST"])
def registro():
    data = request.get_json(silent=True) or {}
    rol = str(data.get("rol", "")).strip().lower()
    nombre = _texto(data, "nombre", maximo=150, minimo=2)
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    ciudad = _texto(data, "ciudad", maximo=100, minimo=2)
    sector = _texto(data, "sector", maximo=100, minimo=2)
    telefono = _texto(data, "telefono", maximo=50) or None
    acepta_terminos = bool(data.get("acepta_terminos"))
    consentimiento = bool(data.get("consentimiento_datos"))

    if rol not in ROLES:
        return _json_error("Selecciona si buscas empleo o representas una empresa.", 400)
    if not nombre:
        return _json_error("Ingresa tu nombre o el de la empresa.", 400)
    if not _email_valido(email):
        return _json_error("Ingresa un correo electrónico válido.", 400)
    if len(password) < 8:
        return _json_error("La contraseña debe tener al menos 8 caracteres.", 400)
    if not ciudad:
        return _json_error("Ingresa una ciudad.", 400)
    if rol == "empresa" and not sector:
        return _json_error("Ingresa el sector de la empresa.", 400)
    if not acepta_terminos:
        return _json_error("Debes aceptar los términos y la política de privacidad.", 400)
    if rol == "candidato" and not consentimiento:
        return _json_error(
            "Autoriza el tratamiento de tus datos de accesibilidad para continuar.", 400
        )
    if query_db("SELECT id FROM perfiles WHERE email = %s", (email,), one=True):
        return _json_error("Ya existe una cuenta con ese correo.", 409)

    password_hash = generate_password_hash(password)
    try:
        with transaction() as (conn, cur):
            cur.execute(
                "INSERT INTO perfiles (rol, nombre, email, password_hash, es_demo, activo) "
                "VALUES (%s, %s, %s, %s, FALSE, TRUE)",
                (rol, nombre, email, password_hash),
            )
            perfil_id = cur.lastrowid
            if rol == "candidato":
                cur.execute(
                    "INSERT INTO candidatos "
                    "(perfil_id, ciudad, telefono, experiencia_anios, modalidad_pref, "
                    "jornada_pref, salario_min, consentimiento_datos, consentimiento_fecha, "
                    "consentimiento_version) "
                    "VALUES (%s, %s, %s, 0, 'cualquiera', 'completa', 0, TRUE, NOW(), %s)",
                    (perfil_id, ciudad, telefono, CONSENT_VERSION),
                )
            else:
                cur.execute(
                    "INSERT INTO empresas (perfil_id, sector, ciudad) VALUES (%s, %s, %s)",
                    (perfil_id, sector, ciudad),
                )
            _notificar(
                cur, perfil_id, "bienvenida", "Bienvenido a IncluTrabajo AI",
                "Completa tu perfil y revisa tus primeras coincidencias.",
                "/inicio",
            )
    except Exception:
        return _json_error("No pudimos crear la cuenta. Revisa los datos e intenta de nuevo.", 400)

    perfil = query_db(
        "SELECT id, rol, nombre, email, es_demo, activo FROM perfiles WHERE id = %s",
        (perfil_id,),
        one=True,
    )
    _iniciar_sesion(perfil, False)
    return jsonify({
        "mensaje": "Cuenta creada con éxito",
        "perfil": _perfil_publico(perfil),
        "rol": perfil["rol"],
    }), 201


# ==================== CATÁLOGOS ====================

@app.route("/api/catalogos", methods=["GET"])
def get_catalogos():
    competencias = query_db("SELECT id, nombre FROM competencias ORDER BY nombre")
    necesidades = query_db(
        "SELECT id, nombre, descripcion FROM necesidades_accesibilidad ORDER BY nombre"
    )
    return jsonify({"competencias": competencias, "necesidades": necesidades}), 200


# ==================== CANDIDATO ====================

@app.route("/api/candidato/perfil", methods=["GET"])
@rol_requerido("candidato")
def get_perfil_candidato():
    perfil = query_db(
        """
        SELECT p.id, p.nombre, p.email, c.ciudad, c.telefono, c.experiencia_anios,
               c.modalidad_pref, c.jornada_pref, c.salario_min,
               c.consentimiento_datos, c.consentimiento_fecha, c.consentimiento_version
        FROM perfiles p JOIN candidatos c ON p.id = c.perfil_id
        WHERE p.id = %s
        """,
        (g.perfil["id"],),
        one=True,
    )
    if not perfil:
        return _json_error("Candidato no encontrado.", 404)
    perfil["competencias"] = query_db(
        "SELECT c.id, c.nombre FROM competencias c "
        "JOIN candidato_competencias cc ON c.id = cc.competencia_id "
        "WHERE cc.candidato_id = %s",
        (g.perfil["id"],),
    )
    perfil["necesidades"] = query_db(
        "SELECT n.id, n.nombre, n.descripcion, cn.critica "
        "FROM necesidades_accesibilidad n "
        "JOIN candidato_necesidades cn ON n.id = cn.necesidad_id "
        "WHERE cn.candidato_id = %s",
        (g.perfil["id"],),
    )
    perfil["consentimiento_datos"] = bool(perfil["consentimiento_datos"])
    return jsonify(perfil), 200


@app.route("/api/candidato/perfil", methods=["PUT"])
@rol_requerido("candidato")
def update_perfil_candidato():
    data = request.get_json(silent=True) or {}
    perfil_id = g.perfil["id"]

    nombre = _texto(data, "nombre", maximo=150, minimo=2)
    ciudad = _texto(data, "ciudad", maximo=100, minimo=2)
    telefono = _texto(data, "telefono", maximo=50) or None
    experiencia = _entero(data, "experiencia_anios", 0, 0, 70)
    modalidad = str(data.get("modalidad_pref", "cualquiera")).strip().lower()
    jornada = str(data.get("jornada_pref", "completa")).strip().lower()
    salario = _decimal(data, "salario_min", 0)
    consentimiento = bool(data.get("consentimiento_datos"))
    modalidades_validas = MODALIDADES | {"cualquiera"}

    if not nombre or not ciudad:
        return _json_error("Nombre y ciudad son obligatorios.", 400)
    if experiencia is None:
        return _json_error("Los años de experiencia deben estar entre 0 y 70.", 400)
    if salario is None:
        return _json_error("La aspiración salarial no es válida.", 400)
    if modalidad not in modalidades_validas:
        return _json_error("La modalidad preferida no es válida.", 400)
    if jornada not in JORNADAS:
        return _json_error("La jornada preferida no es válida.", 400)

    competencia_ids = _ids_validos(data.get("competencia_ids", []), "competencias")
    necesidades_payload = data.get("necesidades")
    if isinstance(necesidades_payload, list) and necesidades_payload and isinstance(necesidades_payload[0], dict):
        necesidades = []
        for item in necesidades_payload:
            try:
                necesidades.append({
                    "id": int(item.get("id")),
                    "critica": bool(item.get("critica")),
                })
            except (TypeError, ValueError, AttributeError):
                continue
        ids_necesidades = [n["id"] for n in necesidades]
        validos = set(_ids_validos(ids_necesidades, "necesidades_accesibilidad"))
        necesidades = [n for n in necesidades if n["id"] in validos]
    else:
        ids_necesidades = _ids_validos(data.get("necesidad_ids", []), "necesidades_accesibilidad")
        necesidades = [{"id": nid, "critica": False} for nid in ids_necesidades]

    try:
        with transaction() as (conn, cur):
            cur.execute(
                "UPDATE candidatos SET ciudad = %s, telefono = %s, experiencia_anios = %s, "
                "modalidad_pref = %s, jornada_pref = %s, salario_min = %s, "
                "consentimiento_datos = %s, consentimiento_fecha = NOW(), "
                "consentimiento_version = %s WHERE perfil_id = %s",
                (
                    ciudad, telefono, experiencia, modalidad, jornada, salario,
                    consentimiento, CONSENT_VERSION, perfil_id,
                ),
            )
            cur.execute("UPDATE perfiles SET nombre = %s WHERE id = %s", (nombre, perfil_id))
            cur.execute("DELETE FROM candidato_competencias WHERE candidato_id = %s", (perfil_id,))
            for cid in competencia_ids:
                cur.execute(
                    "INSERT INTO candidato_competencias (candidato_id, competencia_id) "
                    "VALUES (%s, %s)",
                    (perfil_id, cid),
                )
            cur.execute("DELETE FROM candidato_necesidades WHERE candidato_id = %s", (perfil_id,))
            for necesidad in necesidades:
                cur.execute(
                    "INSERT INTO candidato_necesidades "
                    "(candidato_id, necesidad_id, critica) VALUES (%s, %s, %s)",
                    (perfil_id, necesidad["id"], necesidad["critica"]),
                )
    except Exception:
        return _json_error("No pudimos guardar el perfil. Intenta de nuevo.", 400)

    _recalcular_postulaciones_candidato(perfil_id)
    return _ok("Perfil actualizado con éxito.")


@app.route("/api/candidato/coincidencias", methods=["GET"])
@rol_requerido("candidato")
def get_coincidencias():
    candidato = _candidato_match_data(g.perfil["id"])
    if not candidato:
        return _json_error("Candidato no encontrado.", 404)

    vacantes = query_db(
        """
        SELECT v.*, p.nombre AS nombre_empresa, e.sector
        FROM vacantes v
        JOIN empresas e ON v.empresa_id = e.perfil_id
        JOIN perfiles p ON e.perfil_id = p.id
        WHERE v.activa = TRUE
        ORDER BY v.creado_en DESC
        """
    )
    _adjuntar_detalle_vacantes(vacantes)
    postuladas = {
        fila["vacante_id"] for fila in query_db(
            "SELECT vacante_id FROM postulaciones WHERE candidato_id = %s",
            (g.perfil["id"],),
        )
    }

    resultados = []
    for vacante in vacantes:
        match = calcular_emparejamiento(candidato, vacante)
        resultados.append({
            "vacante": vacante,
            "match": match,
            "ya_postulado": vacante["id"] in postuladas,
        })
    resultados.sort(key=lambda x: (x["match"]["compatible"], x["match"]["score"]), reverse=True)

    limite = request.args.get("limite", type=int)
    if limite and limite > 0:
        resultados = resultados[:limite]
    return jsonify(resultados), 200


# ==================== VACANTES Y POSTULACIONES ====================

@app.route("/api/vacantes", methods=["GET"])
def get_vacantes():
    q = (request.args.get("q") or "").strip()
    ciudad = (request.args.get("ciudad") or "").strip()
    modalidad = (request.args.get("modalidad") or "").strip().lower()
    jornada = (request.args.get("jornada") or "").strip().lower()
    accesibilidad = (request.args.get("accesibilidad") or "").strip()
    page = max(1, request.args.get("page", 1, type=int) or 1)
    per_page = min(50, max(1, request.args.get("per_page", 9, type=int) or 9))

    where = ["v.activa = TRUE"]
    params = []
    if q:
        where.append("(v.cargo LIKE %s OR v.descripcion LIKE %s)")
        like = f"%{q}%"
        params.extend([like, like])
    if ciudad:
        where.append("v.ciudad = %s")
        params.append(ciudad)
    if modalidad:
        if modalidad not in MODALIDADES:
            return _json_error("Modalidad no válida.", 400)
        where.append("v.modalidad = %s")
        params.append(modalidad)
    if jornada:
        if jornada not in JORNADAS:
            return _json_error("Jornada no válida.", 400)
        where.append("v.jornada = %s")
        params.append(jornada)
    if accesibilidad:
        where.append(
            "EXISTS (SELECT 1 FROM vacante_accesibilidad va "
            "JOIN necesidades_accesibilidad n ON n.id = va.necesidad_id "
            "WHERE va.vacante_id = v.id AND n.nombre = %s)"
        )
        params.append(accesibilidad)

    where_sql = " AND ".join(where)
    total = query_db(
        f"SELECT COUNT(*) AS total FROM vacantes v WHERE {where_sql}",
        tuple(params),
        one=True,
    )["total"]
    offset = (page - 1) * per_page
    vacantes = query_db(
        f"""
        SELECT v.*, p.nombre AS nombre_empresa, e.sector
        FROM vacantes v
        JOIN empresas e ON v.empresa_id = e.perfil_id
        JOIN perfiles p ON e.perfil_id = p.id
        WHERE {where_sql}
        ORDER BY v.creado_en DESC
        LIMIT %s OFFSET %s
        """,
        tuple(params) + (per_page, offset),
    )
    _adjuntar_detalle_vacantes(vacantes)
    return jsonify({
        "items": vacantes,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, (total + per_page - 1) // per_page),
    }), 200


@app.route("/api/vacantes/<int:id>", methods=["GET"])
def get_vacante_detalle(id):
    vacante = _vacante_match_data(id)
    if not vacante:
        return _json_error("Vacante no encontrada.", 404)
    vacante["ya_postulado"] = False
    if session.get("rol") == "candidato" and session.get("perfil_id"):
        vacante["ya_postulado"] = bool(query_db(
            "SELECT id FROM postulaciones WHERE candidato_id = %s AND vacante_id = %s",
            (session["perfil_id"], id),
            one=True,
        ))
    return jsonify(vacante), 200


@app.route("/api/postulaciones/<int:vacante_id>", methods=["POST"])
@rol_requerido("candidato")
def postularse(vacante_id):
    if query_db(
        "SELECT id FROM postulaciones WHERE candidato_id = %s AND vacante_id = %s",
        (g.perfil["id"], vacante_id),
        one=True,
    ):
        return _json_error("Ya te has postulado a esta vacante.", 409)

    candidato = _candidato_match_data(g.perfil["id"])
    vacante = _vacante_match_data(vacante_id)
    if not vacante:
        return _json_error("Vacante no encontrada.", 404)
    if not vacante["activa"]:
        return _json_error("Esta vacante ya no está activa.", 409)
    if not candidato:
        return _json_error("Perfil de candidato no encontrado.", 404)

    match = calcular_emparejamiento(candidato, vacante)
    try:
        with transaction() as (conn, cur):
            cur.execute(
                "INSERT INTO postulaciones "
                "(candidato_id, vacante_id, score, explicacion, estado) "
                "VALUES (%s, %s, %s, %s, 'Postulado')",
                (
                    g.perfil["id"], vacante_id, match["score"],
                    json.dumps(match, ensure_ascii=False),
                ),
            )
            postulacion_id = cur.lastrowid
            _historial(cur, postulacion_id, None, "Postulado", None, g.perfil["id"])
            _notificar(
                cur, vacante["empresa_id"], "nueva_postulacion",
                "Nueva postulación recibida",
                f"{g.perfil['nombre']} se postuló a {vacante['cargo']}.",
                f"/empresa/vacantes/{vacante_id}/candidatos",
            )
    except Exception:
        return _json_error("No pudimos registrar la postulación.", 400)
    return jsonify({"mensaje": "Postulación realizada con éxito.", "match": match}), 201


@app.route("/api/postulaciones", methods=["GET"])
@rol_requerido("candidato")
def get_postulaciones():
    posts = query_db(
        """
        SELECT p.*, v.cargo, v.ciudad, v.modalidad, v.salario,
               pr.nombre AS nombre_empresa
        FROM postulaciones p
        JOIN vacantes v ON p.vacante_id = v.id
        JOIN empresas e ON v.empresa_id = e.perfil_id
        JOIN perfiles pr ON e.perfil_id = pr.id
        WHERE p.candidato_id = %s
        ORDER BY p.fecha DESC
        """,
        (g.perfil["id"],),
    )
    for post in posts:
        if post.get("explicacion"):
            try:
                post["explicacion"] = json.loads(post["explicacion"])
            except (TypeError, ValueError):
                pass
        post["historial"] = query_db(
            "SELECT estado_anterior, estado_nuevo, comentario, creado_en "
            "FROM postulacion_historial WHERE postulacion_id = %s ORDER BY creado_en",
            (post["id"],),
        )
        post["puede_retirar"] = post["estado"] not in ESTADOS_FINALES
        post["feedback"] = post.get("feedback")
    return jsonify(posts), 200


@app.route("/api/postulaciones/<int:postulacion_id>", methods=["DELETE"])
@rol_requerido("candidato")
def retirar_postulacion(postulacion_id):
    post = query_db(
        "SELECT p.*, v.cargo, v.empresa_id FROM postulaciones p "
        "JOIN vacantes v ON v.id = p.vacante_id "
        "WHERE p.id = %s AND p.candidato_id = %s",
        (postulacion_id, g.perfil["id"]),
        one=True,
    )
    if not post:
        return _json_error("Postulación no encontrada.", 404)
    if post["estado"] in ESTADOS_FINALES:
        return _json_error("Esta postulación ya está cerrada.", 409)
    try:
        with transaction() as (conn, cur):
            cur.execute(
                "UPDATE postulaciones SET estado = 'Retirada', feedback = %s WHERE id = %s",
                ("Retirada por la persona candidata.", postulacion_id),
            )
            _historial(
                cur, postulacion_id, post["estado"], "Retirada",
                "Retirada por la persona candidata.", g.perfil["id"],
            )
            _notificar(
                cur, post["empresa_id"], "postulacion_retirada",
                "Postulación retirada",
                f"{g.perfil['nombre']} retiró su postulación a {post['cargo']}.",
                f"/empresa/vacantes/{post['vacante_id']}/candidatos",
            )
    except Exception:
        return _json_error("No pudimos retirar la postulación.", 400)
    return _ok("Postulación retirada.")


# ==================== EMPRESA ====================

@app.route("/api/empresa/vacantes", methods=["GET"])
@rol_requerido("empresa")
def get_vacantes_empresa():
    vacantes = query_db(
        "SELECT * FROM vacantes WHERE empresa_id = %s ORDER BY creado_en DESC",
        (g.perfil["id"],),
    )
    _adjuntar_detalle_vacantes(vacantes)
    if vacantes:
        ids = [v["id"] for v in vacantes]
        placeholders = ",".join(["%s"] * len(ids))
        conteos = query_db(
            f"SELECT vacante_id, COUNT(*) AS total FROM postulaciones "
            f"WHERE vacante_id IN ({placeholders}) GROUP BY vacante_id",
            tuple(ids),
        )
        por_vacante = {fila["vacante_id"]: fila["total"] for fila in conteos}
        for vacante in vacantes:
            vacante["postulantes"] = por_vacante.get(vacante["id"], 0)
    return jsonify(vacantes), 200


def _validar_vacante(data):
    cargo = _texto(data, "cargo", maximo=150, minimo=3)
    descripcion = _texto(data, "descripcion", maximo=4000, minimo=10)
    ciudad = _texto(data, "ciudad", maximo=100, minimo=2)
    modalidad = str(data.get("modalidad", "")).strip().lower()
    jornada = str(data.get("jornada", "")).strip().lower()
    salario = _decimal(data, "salario", 0, 0, 1_000_000_000)
    if not cargo or not descripcion or not ciudad:
        return None, "Cargo, descripción y ciudad son obligatorios."
    if modalidad not in MODALIDADES:
        return None, "La modalidad no es válida."
    if jornada not in JORNADAS:
        return None, "La jornada no es válida."
    if salario is None or salario <= 0:
        return None, "Ingresa un salario mayor que cero."
    return {
        "cargo": cargo,
        "descripcion": descripcion,
        "ciudad": ciudad,
        "modalidad": modalidad,
        "jornada": jornada,
        "salario": salario,
        "competencia_ids": _ids_validos(data.get("competencia_ids", []), "competencias"),
        "necesidad_ids": _ids_validos(data.get("necesidad_ids", []), "necesidades_accesibilidad"),
    }, None


@app.route("/api/empresa/vacantes", methods=["POST"])
@rol_requerido("empresa")
def crear_vacante():
    datos, error = _validar_vacante(request.get_json(silent=True) or {})
    if error:
        return _json_error(error, 400)
    try:
        with transaction() as (conn, cur):
            cur.execute(
                "INSERT INTO vacantes "
                "(empresa_id, cargo, descripcion, ciudad, modalidad, jornada, salario, activa) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)",
                (
                    g.perfil["id"], datos["cargo"], datos["descripcion"], datos["ciudad"],
                    datos["modalidad"], datos["jornada"], datos["salario"],
                ),
            )
            vacante_id = cur.lastrowid
            for cid in datos["competencia_ids"]:
                cur.execute(
                    "INSERT INTO vacante_requisitos (vacante_id, competencia_id) VALUES (%s, %s)",
                    (vacante_id, cid),
                )
            for nid in datos["necesidad_ids"]:
                cur.execute(
                    "INSERT INTO vacante_accesibilidad (vacante_id, necesidad_id) VALUES (%s, %s)",
                    (vacante_id, nid),
                )
    except Exception:
        return _json_error("No pudimos publicar la vacante.", 400)
    return jsonify({"mensaje": "Vacante creada con éxito.", "id": vacante_id}), 201


@app.route("/api/empresa/vacantes/<int:vacante_id>", methods=["PATCH"])
@rol_requerido("empresa")
def actualizar_vacante(vacante_id):
    actual = query_db(
        "SELECT * FROM vacantes WHERE id = %s AND empresa_id = %s",
        (vacante_id, g.perfil["id"]),
        one=True,
    )
    if not actual:
        return _json_error("Vacante no encontrada o no pertenece a tu empresa.", 404)
    datos, error = _validar_vacante(request.get_json(silent=True) or {})
    if error:
        return _json_error(error, 400)

    verificadas = {
        fila["necesidad_id"]: (fila["verificada"], fila["evidencia"], fila["verificada_en"])
        for fila in query_db(
            "SELECT necesidad_id, verificada, evidencia, verificada_en "
            "FROM vacante_accesibilidad WHERE vacante_id = %s",
            (vacante_id,),
        )
    }
    try:
        with transaction() as (conn, cur):
            cur.execute(
                "UPDATE vacantes SET cargo = %s, descripcion = %s, ciudad = %s, "
                "modalidad = %s, jornada = %s, salario = %s WHERE id = %s",
                (
                    datos["cargo"], datos["descripcion"], datos["ciudad"],
                    datos["modalidad"], datos["jornada"], datos["salario"], vacante_id,
                ),
            )
            cur.execute("DELETE FROM vacante_requisitos WHERE vacante_id = %s", (vacante_id,))
            for cid in datos["competencia_ids"]:
                cur.execute(
                    "INSERT INTO vacante_requisitos (vacante_id, competencia_id) VALUES (%s, %s)",
                    (vacante_id, cid),
                )
            cur.execute("DELETE FROM vacante_accesibilidad WHERE vacante_id = %s", (vacante_id,))
            for nid in datos["necesidad_ids"]:
                verificada, evidencia, verificada_en = verificadas.get(nid, (False, None, None))
                cur.execute(
                    "INSERT INTO vacante_accesibilidad "
                    "(vacante_id, necesidad_id, verificada, evidencia, verificada_en) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (vacante_id, nid, bool(verificada), evidencia, verificada_en),
                )
    except Exception:
        return _json_error("No pudimos actualizar la vacante.", 400)

    _recalcular_postulaciones_vacante(vacante_id)
    return _ok("Vacante actualizada con éxito.")


@app.route("/api/empresa/vacantes/<int:vacante_id>/estado", methods=["PATCH"])
@rol_requerido("empresa")
def cambiar_estado_vacante(vacante_id):
    data = request.get_json(silent=True) or {}
    activa = data.get("activa")
    if not isinstance(activa, bool):
        return _json_error("Indica si la vacante debe estar activa o cerrada.", 400)
    existente = query_db(
        "SELECT id FROM vacantes WHERE id = %s AND empresa_id = %s",
        (vacante_id, g.perfil["id"]),
        one=True,
    )
    if not existente:
        return _json_error("Vacante no encontrada o no pertenece a tu empresa.", 404)
    modify_db("UPDATE vacantes SET activa = %s WHERE id = %s", (activa, vacante_id))
    return _ok("Vacante cerrada." if not activa else "Vacante reabierta.")


@app.route("/api/empresa/vacantes/<int:vacante_id>/candidatos", methods=["GET"])
@rol_requerido("empresa")
def get_candidatos_vacante(vacante_id):
    vacante = query_db(
        "SELECT * FROM vacantes WHERE id = %s AND empresa_id = %s",
        (vacante_id, g.perfil["id"]),
        one=True,
    )
    if not vacante:
        return _json_error("Vacante no encontrada o no pertenece a tu empresa.", 404)

    vacante_match = _vacante_match_data(vacante_id)
    postulaciones = query_db(
        """
        SELECT p.*, pr.nombre AS nombre_candidato, pr.email,
               c.ciudad, c.experiencia_anios, c.modalidad_pref, c.salario_min,
               c.consentimiento_datos
        FROM postulaciones p
        JOIN candidatos c ON p.candidato_id = c.perfil_id
        JOIN perfiles pr ON c.perfil_id = pr.id
        WHERE p.vacante_id = %s
        ORDER BY p.score DESC
        """,
        (vacante_id,),
    )
    for post in postulaciones:
        if post.get("explicacion"):
            try:
                post["explicacion"] = json.loads(post["explicacion"])
            except (TypeError, ValueError):
                pass
        candidato = _candidato_match_data(post["candidato_id"])
        if candidato:
            match = calcular_emparejamiento(candidato, vacante_match)
            post["score_actual"] = match["score"]
            post["nivel_actual"] = match["nivel"]
            post["compatibilidad_actual"] = match["compatible"]
            post["competencias"] = candidato["competencias"]
            post["consentimiento_datos"] = bool(post["consentimiento_datos"])
            post["necesidades"] = (
                candidato["necesidades"] if post["consentimiento_datos"] else []
            )
            if not post["consentimiento_datos"]:
                # No revelar detalles de accesibilidad en las razones del match.
                post["explicacion"] = None
        post["historial"] = query_db(
            "SELECT estado_anterior, estado_nuevo, comentario, creado_en "
            "FROM postulacion_historial WHERE postulacion_id = %s ORDER BY creado_en",
            (post["id"],),
        )
    return jsonify(postulaciones), 200


@app.route("/api/empresa/postulaciones/<int:postulacion_id>/estado", methods=["PATCH"])
@rol_requerido("empresa")
def actualizar_estado_postulacion(postulacion_id):
    data = request.get_json(silent=True) or {}
    nuevo = str(data.get("estado", "")).strip()
    comentario = _texto(data, "comentario", maximo=2000) or None
    if nuevo not in ESTADOS:
        return _json_error("Estado de postulación no válido.", 400)
    post = query_db(
        """
        SELECT p.*, v.cargo, v.empresa_id
        FROM postulaciones p JOIN vacantes v ON v.id = p.vacante_id
        WHERE p.id = %s AND v.empresa_id = %s
        """,
        (postulacion_id, g.perfil["id"]),
        one=True,
    )
    if not post:
        return _json_error("Postulación no encontrada.", 404)
    if nuevo == post["estado"]:
        return _ok("La postulación ya tiene ese estado.")
    permitidos = TRANSICIONES.get(post["estado"], set())
    if nuevo not in permitidos:
        return _json_error(
            f"No se puede pasar de “{post['estado']}” a “{nuevo}”.", 409
        )
    if nuevo == "No seleccionado" and not comentario:
        comentario = "La empresa cerró el proceso sin seleccionar esta candidatura."
    try:
        with transaction() as (conn, cur):
            cur.execute(
                "UPDATE postulaciones SET estado = %s, feedback = %s WHERE id = %s",
                (nuevo, comentario, postulacion_id),
            )
            _historial(
                cur, postulacion_id, post["estado"], nuevo, comentario, g.perfil["id"]
            )
            _notificar(
                cur, post["candidato_id"], "estado_postulacion",
                f"Tu postulación a {post['cargo']} cambió de estado",
                f"Ahora está en “{nuevo}”. {comentario or ''}".strip(),
                "/postulaciones",
            )
    except Exception:
        return _json_error("No pudimos actualizar el estado.", 400)
    return _ok("Estado actualizado.")


# ==================== NOTIFICACIONES ====================

@app.route("/api/notificaciones", methods=["GET"])
def get_notificaciones():
    perfil = _perfil_actual()
    if not perfil:
        return _json_error("Inicia sesión para continuar.", 401)
    notificaciones = query_db(
        "SELECT id, tipo, titulo, mensaje, url, leida, creada_en "
        "FROM notificaciones WHERE perfil_id = %s ORDER BY creada_en DESC LIMIT 50",
        (perfil["id"],),
    )
    no_leidas = query_db(
        "SELECT COUNT(*) AS total FROM notificaciones "
        "WHERE perfil_id = %s AND leida = FALSE",
        (perfil["id"],),
        one=True,
    )["total"]
    return jsonify({"items": notificaciones, "no_leidas": no_leidas}), 200


@app.route("/api/notificaciones/<int:notificacion_id>/leida", methods=["PATCH"])
def marcar_notificacion(notificacion_id):
    perfil = _perfil_actual()
    if not perfil:
        return _json_error("Inicia sesión para continuar.", 401)
    modify_db(
        "UPDATE notificaciones SET leida = TRUE WHERE id = %s AND perfil_id = %s",
        (notificacion_id, perfil["id"]),
    )
    return _ok("Notificación marcada como leída.")


@app.route("/api/notificaciones/leer-todas", methods=["PATCH"])
def marcar_todas_notificaciones():
    perfil = _perfil_actual()
    if not perfil:
        return _json_error("Inicia sesión para continuar.", 401)
    modify_db(
        "UPDATE notificaciones SET leida = TRUE WHERE perfil_id = %s",
        (perfil["id"],),
    )
    return _ok("Todas las notificaciones fueron marcadas como leídas.")


# ==================== SPA FALLBACK ====================

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path):
    if path.startswith("api/") or path == "api":
        return _json_error("Recurso de API no encontrado.", 404)

    if path:
        archivo = os.path.abspath(os.path.join(DIST_DIR, path))
        if archivo.startswith(DIST_DIR + os.sep) and os.path.isfile(archivo):
            response = send_from_directory(DIST_DIR, path)
            if path.startswith("assets/"):
                response.cache_control.public = True
                response.cache_control.max_age = 31536000
            return response

    index_file = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_file):
        response = send_from_directory(DIST_DIR, "index.html")
        response.cache_control.no_cache = True
        return response

    return jsonify({
        "error": "Frontend no compilado. Ejecuta 'npm install' y 'npm run build' en la carpeta frontend."
    }), 404


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "127.0.0.1")
    app.run(host=host, port=port, debug=os.getenv("FLASK_DEBUG", "0") == "1")
