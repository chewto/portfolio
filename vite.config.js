import { resolve } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  plugins: [tailwindcss()],
  build: {
    target: "es2022",
    cssMinify: "lightningcss",
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        cv: resolve(import.meta.dirname, "cv.html"),
        es: resolve(import.meta.dirname, "es", "index.html"),
        cvEs: resolve(import.meta.dirname, "es", "cv.html"),
      },
    },
  },
});
