import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
PORT = 5055
BASE_URL = f"http://127.0.0.1:{PORT}"


def esperar_servidor():
    for _ in range(60):
        try:
            with urllib.request.urlopen(f"{BASE_URL}/api/health", timeout=2) as resp:
                if resp.status == 200:
                    return
        except Exception:
            time.sleep(0.5)
    raise RuntimeError("El servidor de pruebas no arrancó.")


@pytest.fixture(scope="session")
def servidor():
    env = os.environ.copy()
    env.update({
        "PORT": str(PORT),
        "HOST": "127.0.0.1",
        "FLASK_DEBUG": "0",
        "PYTHONIOENCODING": "utf-8",
    })
    proceso = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=BACKEND,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        esperar_servidor()
        yield BASE_URL
    finally:
        proceso.terminate()
        try:
            proceso.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proceso.kill()


@pytest.fixture()
def page(servidor):
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(channel="msedge", headless=True)
        except Exception:
            browser = p.chromium.launch(headless=True)
        pagina = browser.new_page(viewport={"width": 1440, "height": 1000})
        errores = []
        pagina.on("console", lambda m: errores.append(m.text) if m.type == "error" and "401" not in m.text else None)
        pagina.on("pageerror", lambda e: errores.append(str(e)))
        yield pagina
        assert not errores, f"Errores de consola: {errores}"
        browser.close()


def test_login_con_correo_y_cuentas_demo(page, servidor):
    page.goto(f"{servidor}/login", wait_until="networkidle")
    assert page.get_by_role("heading", level=1).inner_text().startswith("Inicia sesión")
    page.fill("#email", "ana.torres@demo.com")
    page.fill("#password", "incorrecta")
    page.get_by_role("button", name="Entrar", exact=True).click()
    page.wait_for_timeout(600)
    assert page.get_by_text("No pudimos iniciar sesión").is_visible()

    page.fill("#password", "Demo2026!")
    page.get_by_role("button", name="Entrar", exact=True).click()
    page.wait_for_url("**/inicio")
    page.locator("h1", has_text="Hola").wait_for(timeout=10000)
    assert "Hola" in page.locator("h1", has_text="Hola").inner_text()


def test_registro_tiene_formulario_completo(page, servidor):
    page.goto(f"{servidor}/registro", wait_until="networkidle")
    assert page.get_by_role("button", name="Busco empleo").get_attribute("aria-pressed") == "true"
    for campo in ["#nombre", "#email", "#ciudad", "#password", "#confirmar", "#consentimiento", "#terminos"]:
        assert page.locator(campo).is_visible()
    page.get_by_role("button", name="Soy empresa").click()
    assert page.locator("#sector").is_visible()
    assert not page.locator("#consentimiento").count()


def test_flujo_candidato(page, servidor):
    page.goto(f"{servidor}/login", wait_until="networkidle")
    page.get_by_role("button", name="Entrar como Ana Torres (candidato)").click()
    page.wait_for_url("**/inicio")

    page.goto(f"{servidor}/coincidencias", wait_until="networkidle")
    assert page.get_by_text("Competencias", exact=True).first.is_visible()
    assert page.get_by_text("Accesibilidad", exact=True).first.is_visible()
    assert page.get_by_text("Ubicación y modalidad", exact=True).first.is_visible()
    assert page.get_by_text("Salario y jornada", exact=True).first.is_visible()

    page.goto(f"{servidor}/vacantes", wait_until="networkidle")
    assert page.get_by_role("heading", name="Todas las vacantes").is_visible()
    assert page.locator("article").count() >= 1

    page.goto(f"{servidor}/vacantes/1", wait_until="networkidle")
    assert page.get_by_text("Accesibilidad y ajustes razonables").is_visible()
    assert page.get_by_text("Verificada").first.is_visible()

    page.goto(f"{servidor}/postulaciones", wait_until="networkidle")
    assert page.get_by_role("heading", name="Mis postulaciones").is_visible()
    assert page.get_by_text("Línea de tiempo").first.is_visible()


def test_flujo_empresa(page, servidor):
    page.goto(f"{servidor}/login", wait_until="networkidle")
    page.get_by_role("button", name="Entrar como TechIncluye S.A.S. (empresa)").click()
    page.wait_for_url("**/inicio")
    page.goto(f"{servidor}/empresa", wait_until="networkidle")
    assert page.get_by_role("heading", name="Panel de empresa").is_visible()
    assert page.get_by_text("postulante").first.is_visible()
    page.get_by_role("link", name="Ver candidatos").first.click()
    page.get_by_text("Ajustes de accesibilidad").first.wait_for(timeout=10000)
    assert page.get_by_role("heading", name="Candidatos postulados").is_visible()
    assert page.get_by_text("Compatibilidad actual").first.is_visible()
    assert page.get_by_text("Ajustes de accesibilidad").first.is_visible()


def test_accesibilidad_basica(page, servidor):
    page.goto(f"{servidor}/login", wait_until="networkidle")
    html = page.locator("html")
    assert html.get_attribute("lang") == "es"

    page.get_by_role("button", name="Aumentar tamaño de letra (actual 100%)").click()
    page.wait_for_timeout(200)
    assert html.evaluate("el => el.style.fontSize") == "17.6px"

    for _ in range(20):
        page.locator("button[title='Aumentar tamaño de letra']").click()
    assert html.evaluate("el => parseFloat(el.style.fontSize)") <= 32
    assert html.evaluate("el => parseFloat(el.style.fontSize)") == 32

    page.get_by_role("button", name="Alto contraste").click()
    assert html.get_attribute("data-contrast") == "high"
    page.get_by_role("button", name="Contraste alto").click()
    assert html.get_attribute("data-contrast") is None

    page.locator("button[title='Restablecer tamaño de letra']").click()
    assert html.evaluate("el => el.style.fontSize") == "16px"


def test_movil_sin_desbordamiento(servidor):
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(channel="msedge", headless=True)
        except Exception:
            browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True)
        for ruta in ["/login", "/registro", "/vacantes"]:
            page.goto(f"{servidor}{ruta}", wait_until="networkidle")
            ancho = page.evaluate("document.documentElement.scrollWidth")
            assert ancho <= 390, f"Desbordamiento en {ruta}: {ancho}px"
        browser.close()
