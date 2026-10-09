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
	build: {
		rolldownOptions: {
			output: {
				codeSplitting: {
					groups: [
						{
							name: "vendor",
							test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
						},
						{
							name: "ui",
							test: /[\\/]node_modules[\\/](@uiw|@base-ui|lucide-react)[\\/]/,
						},
						{
							name: "codemirror",
							test: /[\\/]node_modules[\\/](@codemirror)[\\/]/,
						},
					],
				},
			},
		},
	},
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
