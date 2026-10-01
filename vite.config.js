import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        admin: resolve(root, "index.html"),
        websiteHome: resolve(root, "Drive_Shine-main/index.html"),
        websiteServices: resolve(root, "Drive_Shine-main/services.html"),
        websitePackages: resolve(root, "Drive_Shine-main/packages.html"),
        websiteAbout: resolve(root, "Drive_Shine-main/about.html"),
        websiteContact: resolve(root, "Drive_Shine-main/contact.html"),
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
});
