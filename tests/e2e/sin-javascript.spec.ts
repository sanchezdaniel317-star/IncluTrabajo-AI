// Celular sencillo o navegador sin JavaScript: todo lo esencial debe funcionar igual.
import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test("persona sin JavaScript: entra, se postula y ajusta la página", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hola. Aquí tu talento cuenta.");
  // La coincidencia de ejemplo se ve completa aunque no haya animación.
  await expect(page.locator("[data-armado] [data-razon]")).toHaveCount(5);

  await page.goto("/ingresar");
  await page.getByRole("button", { name: /Entrar como Carlos Gómez/ }).click();
  await expect(page).toHaveURL(/\/persona$/);

  await page.goto("/vacantes/2");
  await page.getByRole("button", { name: "Postularme" }).click();
  await expect(page).toHaveURL(/\/persona\/postulaciones$/);
  await expect(page.getByRole("status")).toContainText("Te postulaste a Desarrollador(a) junior frontend");

  // Preferencias por formulario normal (sin fetch).
  await page.locator("summary", { hasText: "Accesibilidad" }).click();
  await page.getByRole("radio", { name: "Alta legibilidad" }).check();
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-letra", "legible");
});

test("filtros del catálogo sin JavaScript", async ({ page }) => {
  await page.goto("/vacantes");
  await page.getByLabel("Ciudad").selectOption("Barranquilla");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/ciudad=Barranquilla/);
  const tarjetas = page.getByRole("main").getByRole("listitem").filter({ has: page.getByRole("heading", { level: 2 }) });
  await expect(tarjetas).toHaveCount(3);
});

test("empresa sin JavaScript: mueve una candidatura con mensaje", async ({ page }) => {
  await page.goto("/ingresar");
  await page.getByRole("button", { name: /Entrar como Comercial del Caribe/ }).click();
  await page.goto("/empresa/vacantes/6/candidaturas");
  await page.getByRole("radio", { name: "En revisión" }).check();
  await page.getByLabel(/Mensaje para la persona/).fill("Revisamos tu perfil y te llamamos esta semana.");
  await page.getByRole("button", { name: "Guardar y avisar" }).click();
  await expect(page.getByRole("status")).toContainText("En revisión");
});
