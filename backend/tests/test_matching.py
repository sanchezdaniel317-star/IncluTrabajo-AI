import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from matching import calcular_emparejamiento  # noqa: E402


def candidato(**extra):
    data = {
        "ciudad": "Cartagena",
        "modalidad_pref": "hibrido",
        "jornada_pref": "completa",
        "salario_min": 1800000,
        "competencias": [{"nombre": "atención al cliente"}, {"nombre": "excel"}],
        "necesidades": [
            {"nombre": "lector de pantalla", "critica": True},
            {"nombre": "horario flexible", "critica": False},
        ],
    }
    data.update(extra)
    return data


def vacante(**extra):
    data = {
        "ciudad": "Cartagena",
        "modalidad": "hibrido",
        "jornada": "completa",
        "salario": 1900000,
        "requisitos": [{"nombre": "atención al cliente"}, {"nombre": "excel"}],
        "accesibilidad": [
            {"nombre": "lector de pantalla", "verificada": True},
            {"nombre": "horario flexible", "verificada": False},
        ],
    }
    data.update(extra)
    return data


def test_match_perfecto_suma_100():
    resultado = calcular_emparejamiento(candidato(), vacante())
    assert resultado["score"] == 100
    assert resultado["nivel"] == "Alta"
    assert resultado["compatible"] is True
    assert resultado["confianza"] == "alta"
    assert sum(item["maximo"] for item in resultado["detalle"]) == 100
    assert resultado["version"] == "matching_v2"


def test_jornada_incorrecta_penaliza_cinco_puntos():
    resultado = calcular_emparejamiento(candidato(), vacante(jornada="medio_tiempo"))
    assert resultado["score"] == 95
    assert resultado["detalle"][-1]["obtenido"] == 10
    assert any("jornada" in f.lower() for f in resultado["faltantes"])


def test_modalidad_incompatible_penaliza_ubicacion():
    resultado = calcular_emparejamiento(
        candidato(modalidad_pref="presencial"), vacante(modalidad="remoto")
    )
    assert resultado["detalle"][2]["obtenido"] == 0
    assert resultado["score"] == 85


def test_necesidad_esencial_no_cubierta_bloquea_vacante():
    resultado = calcular_emparejamiento(
        candidato(), vacante(accesibilidad=[{"nombre": "horario flexible", "verificada": True}])
    )
    assert resultado["bloqueante"] is True
    assert resultado["compatible"] is False
    assert resultado["nivel"] == "No compatible"
    assert resultado["detalle"][1]["obtenido"] < 30


def test_sin_datos_no_regala_puntos():
    resultado = calcular_emparejamiento(
        candidato(competencias=[]), vacante()
    )
    assert resultado["detalle"][0]["obtenido"] == 0
    assert resultado["confianza"] == "media"
    assert any("competencias" in f.lower() for f in resultado["faltantes"])


def test_vacante_sin_competencias_no_regala_40():
    resultado = calcular_emparejamiento(candidato(), vacante(requisitos=[]))
    assert resultado["detalle"][0]["obtenido"] == 0
    assert resultado["detalle"][0]["estado"] == "sin_datos"


def test_no_usa_atributos_protegidos():
    base = calcular_emparejamiento(candidato(), vacante())
    con_datos_sensibles = calcular_emparejamiento(
        candidato(
            edad=54,
            genero="mujer",
            nacionalidad="migrante",
            discapacidad="visual",
            etnia="afrodescendiente",
        ),
        vacante(),
    )
    assert base["score"] == con_datos_sensibles["score"]
    assert base["detalle"] == con_datos_sensibles["detalle"]


def test_salario_bajo_no_cumple():
    resultado = calcular_emparejamiento(candidato(salario_min=3000000), vacante())
    assert resultado["detalle"][-1]["obtenido"] == 5
    assert any("salario" in f.lower() for f in resultado["faltantes"])
