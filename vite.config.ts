import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    {
      name: 'force-php-wasm-url',
      enforce: 'pre',
      async resolveId(source, importer, options) {
        // Target only .wasm files imported from within @php-wasm
        if (source.endsWith('.wasm') && importer?.includes('@php-wasm')) {
          const resolution = await this.resolve(source, importer, {
            skipSelf: true,
            ...options,
          });
          if (resolution) {
            // Append ?url to force Vite to treat it as a static asset string
            return `${resolution.id}?url`;
          }
        }
      },
    },
  ],

  assetsInclude: [/\.dat$/, /\.wasm$/, /\.so$/, /\.la$/],
  optimizeDeps: {
    exclude: ['@php-wasm/web-8-4'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
})
