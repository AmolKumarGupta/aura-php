import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import forceWasmUrl from "./vite-plugins/force-wasm-url.js";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		babel({ presets: [reactCompilerPreset()] }),
		forceWasmUrl(),
	],
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "./src"),
		},
	},

	assetsInclude: [/\.dat$/, /\.wasm$/, /\.so$/, /\.la$/],
	optimizeDeps: {
		exclude: ["@php-wasm/web-8-4"],
	},
	server: {
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "credentialless",
		},
	},
});
