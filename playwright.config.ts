import { defineConfig } from "@playwright/test";

const PUERTO = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PUERTO}`,
    channel: process.env.PW_CHANNEL ?? "msedge",
    locale: "es-CO",
  },
  webServer: {
    command: "node node_modules/@react-router/serve/bin.js ./build/server/index.js",
    url: `http://127.0.0.1:${PUERTO}/`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      PORT: String(PUERTO),
      HOST: "127.0.0.1",
      NODE_ENV: "production",
      PGLITE_DIR: "memory",
      SESSION_SECRET: "e2e-0123456789abcdef0123456789abcdef0123",
      COOKIE_SECURE: "0",
    },
  },
});
