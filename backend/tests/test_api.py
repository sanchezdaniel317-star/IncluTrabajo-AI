import sys
import time
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app as app_module  # noqa: E402
from db import modify_db  # noqa: E402


@pytest.fixture()
def client():
    app_module.app.config.update(TESTING=True)
    with app_module.app.test_client() as client:
        yield client


def login_demo(client, perfil_id=1):
    respuesta = client.post("/api/auth/demo", json={"perfil_id": perfil_id})
    assert respuesta.status_code == 200
    return respuesta


def test_health(client):
    data = client.get("/api/health").get_json()
    assert data["status"] == "ok"
    assert data["matching"] == "matching_v2"


def test_login_valido_e_invalido(client):
    ok = client.post(
        "/api/auth/login",
        json={"email": "ana.torres@demo.com", "password": "Demo2026!"},
    )
    assert ok.status_code == 200
    assert ok.get_json()["rol"] == "candidato"

    malo = client.post(
        "/api/auth/login",
        json={"email": "ana.torres@demo.com", "password": "incorrecta"},
    )
    assert malo.status_code == 401
    assert "incorrectos" in malo.get_json()["error"]


def test_demo_solo_permite_cuentas_demo(client):
    assert client.post("/api/auth/demo", json={"perfil_id": 1}).status_code == 200
    client.delete("/api/sesion")
    assert client.post("/api/auth/demo", json={"perfil_id": 999999}).status_code == 404


def test_cuentas_demo_no_exponen_usuarios_reales(client):
    cuentas = client.get("/api/auth/demo-cuentas").get_json()
    assert cuentas
    assert all(c["email"].endswith("demo.com") or c["id"] in {3, 4} for c in cuentas)


def test_permisos_por_rol(client):
    login_demo(client, 3)
    assert client.get("/api/candidato/perfil").status_code == 403
    assert client.get("/api/empresa/vacantes").status_code == 200


def test_coincidencias_tienen_desglose(client):
    login_demo(client, 1)
    data = client.get("/api/candidato/coincidencias").get_json()
    assert data
    primer = data[0]
    assert "detalle" in primer["match"]
    assert len(primer["match"]["detalle"]) == 4
    assert "ya_postulado" in primer


def test_catalogo_publico_y_filtros(client):
    data = client.get("/api/vacantes?page=1&per_page=2").get_json()
    assert set(data) == {"items", "total", "page", "per_page", "pages"}
    assert len(data["items"]) <= 2
    assert data["items"][0]["accesibilidad"][0]["verificada"] in (0, 1, False, True)


def test_detalle_vacante_expone_verificacion(client):
    data = client.get("/api/vacantes/1").get_json()
    assert "accesibilidad" in data
    assert all("verificada" in item for item in data["accesibilidad"])


def test_registro_valida_campos(client):
    sin_terminos = client.post("/api/auth/registro", json={
        "rol": "candidato",
        "nombre": "Prueba",
        "email": "prueba@example.com",
        "password": "Segura2026!",
        "ciudad": "Cartagena",
        "acepta_terminos": False,
        "consentimiento_datos": True,
    })
    assert sin_terminos.status_code == 400

    corta = client.post("/api/auth/registro", json={
        "rol": "candidato",
        "nombre": "Prueba",
        "email": "prueba@example.com",
        "password": "corta",
        "ciudad": "Cartagena",
        "acepta_terminos": True,
        "consentimiento_datos": True,
    })
    assert corta.status_code == 400
    assert "8 caracteres" in corta.get_json()["error"]


def test_registro_valido_crea_sesion_y_perfil(client):
    email = f"prueba.{int(time.time() * 1000)}@example.com"
    try:
        respuesta = client.post("/api/auth/registro", json={
            "rol": "candidato",
            "nombre": "Persona de Prueba",
            "email": email,
            "password": "Segura2026!",
            "ciudad": "Cartagena",
            "acepta_terminos": True,
            "consentimiento_datos": True,
        })
        assert respuesta.status_code == 201
        assert respuesta.get_json()["perfil"]["email"] == email
        assert client.get("/api/sesion").get_json()["rol"] == "candidato"
        assert client.get("/api/candidato/perfil").status_code == 200
    finally:
        modify_db("DELETE FROM perfiles WHERE email = %s", (email,))


def test_api_inexistente_devuelve_json_404(client):
    respuesta = client.get("/api/ruta-que-no-existe")
    assert respuesta.status_code == 404
    assert respuesta.is_json


def test_notificaciones_requieren_sesion(client):
    assert client.get("/api/notificaciones").status_code == 401
