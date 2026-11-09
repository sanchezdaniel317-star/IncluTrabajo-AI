import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const ETIQUETAS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function sinViolaciones(page: Page, nombre: string) {
  const r = await new AxeBuilder({ page }).withTags(ETIQUETAS).analyze();
  const resumen = r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  expect(resumen, `${nombre}: ${resumen.join("\n")}`).toEqual([]);
}

async function entrarDemo(page: Page, nombre: string) {
  await page.goto("/ingresar");
  await page.getByRole("button", { name: new RegExp(`Entrar como ${nombre}`) }).click();
  await page.waitForURL(/\/(persona|empresa)/);
}

const PUBLICAS = ["/", "/vacantes", "/vacantes/1", "/ingresar", "/registro", "/registro?rol=empresa", "/accesibilidad", "/privacidad"];

test.describe("axe · WCAG 2.2 AA", () => {
  for (const ruta of PUBLICAS) {
    test(`pública ${ruta}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(ruta);
      await sinViolaciones(page, ruta);
    });
  }

  test("persona: inicio, para ti, perfil, postulaciones, avisos y vacante", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await entrarDemo(page, "Ana Torres");
    for (const ruta of ["/persona", "/persona/coincidencias", "/persona/perfil", "/persona/postulaciones", "/avisos", "/vacantes/3", "/vacantes"]) {
      await page.goto(ruta);
      await sinViolaciones(page, ruta);
    }
  });

  test("empresa: panel, publicar, editar, candidaturas y cuota", async ({ page }) => {
    await entrarDemo(page, "TechIncluye");
    for (const ruta of ["/empresa", "/empresa/vacantes/nueva", "/empresa/vacantes/1", "/empresa/vacantes/1/candidaturas", "/empresa/cumplimiento"]) {
      await page.goto(ruta);
      await sinViolaciones(page, ruta);
    }
  });

  test("alto contraste elegido en la página", async ({ page }) => {
    await page.goto("/");
    await page.locator("summary", { hasText: "Accesibilidad" }).click();
    await page.getByRole("radio", { name: "Alto contraste" }).check();
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-contraste", "alto");
    await sinViolaciones(page, "/ (alto contraste)");
    await page.goto("/vacantes/1");
    await sinViolaciones(page, "/vacantes/1 (alto contraste)");
  });
});

test.describe("teclado, zoom y reflujo", () => {
  test("el primer Tab muestra «Saltar al contenido» y lleva al contenido", async ({ page }) => {
    await page.goto("/vacantes");
    await page.keyboard.press("Tab");
    const saltar = page.getByRole("link", { name: "Saltar al contenido" });
    await expect(saltar).toBeFocused();
    await expect(saltar).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#contenido$/);
  });

  for (const ruta of ["/", "/vacantes", "/vacantes/1", "/registro", "/ingresar"]) {
    test(`reflujo a 320 px sin scroll horizontal: ${ruta}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(ruta);
      const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(ancho).toBeLessThanOrEqual(320);
    });
  }

  test("texto muy grande no rompe la portada", async ({ page }) => {
    await page.goto("/");
    await page.locator("summary", { hasText: "Accesibilidad" }).click();
    await page.getByRole("radio", { name: "Muy grande" }).check();
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-texto", "enorme");
    await page.setViewportSize({ width: 390, height: 844 });
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(ancho).toBeLessThanOrEqual(390);
  });
});
