import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    alias: { "~": fileURLToPath(new URL("./app", import.meta.url)) },
  },
  ssr: {
    // Módulos nativos o con WASM se cargan desde node_modules en el servidor.
    external: ["argon2", "@electric-sql/pglite", "pg"],
  },
  server: { port: 5173, host: "127.0.0.1" },
});
