import type { Config } from "@react-router/dev/config";

export default {
  // Render en servidor: la página llega completa aunque el celular no ejecute JavaScript.
  ssr: true,
} satisfies Config;
