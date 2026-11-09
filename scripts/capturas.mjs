// Capturas de revisión (Playwright, Edge sin ventana). Uso: node scripts/capturas.mjs http://127.0.0.1:3100 .impeccable/review
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://127.0.0.1:3100";
const dir = process.argv[3] ?? ".impeccable/review";
mkdirSync(dir, { recursive: true });

const navegador = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "msedge", headless: true });

async function contexto(ancho, alto, movil = false) {
  const c = await navegador.newContext({ viewport: { width: ancho, height: alto }, isMobile: movil, hasTouch: movil, reducedMotion: "reduce", locale: "es-CO" });
  return c;
}
async function entrar(page, demo) {
  await page.goto(base + "/ingresar");
  await page.getByRole("button", { name: new RegExp(`Entrar como ${demo}`) }).click();
  await page.waitForURL(/\/(persona|empresa)/);
}

const capturas = [
  ["desktop.png", 1440, 900, false, null, "/", true],
  ["mobile.png", 390, 844, true, null, "/", true],
  ["app-persona-mobile.png", 390, 844, true, "Ana Torres", "/persona/coincidencias?todas=si", false],
  ["app-empresa-desktop.png", 1440, 900, false, "Comercial del Caribe", "/empresa", true],
  ["app-vacante-mobile.png", 390, 844, true, "Ana Torres", "/vacantes/5", true],
  ["barra-320-enorme.png", 320, 640, true, "Ana Torres", "/persona", false],
  ["desktop-con-sesion.png", 1440, 900, false, "Ana Torres", "/", false],
];

for (const [archivo, ancho, alto, movil, demo, ruta, completa] of capturas) {
  const c = await contexto(ancho, alto, movil);
  if (archivo.includes("enorme")) await c.addCookies([{ name: "it_prefs", value: encodeURIComponent(btoa(JSON.stringify({ texto: "enorme" }))), url: base }]);
  const page = await c.newPage();
  if (demo) await entrar(page, demo);
  await page.goto(base + ruta);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${dir}/${archivo}`, fullPage: completa });
  console.log("ok", archivo);
  await c.close();
}
await navegador.close();
