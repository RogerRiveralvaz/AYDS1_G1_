import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.0.0"),
      __API_URL__: JSON.stringify(env.VITE_API_URL ?? ""),
    },
  };
});
