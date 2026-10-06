import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// The packaged app runs from file:// with no network. This CSP only goes into the
// production build; the dev server needs inline scripts and a websocket for HMR.
const csp: Plugin = {
  name: 'uc-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '<head>',
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">`,
    ),
}

export default defineConfig({
  base: './',
  plugins: [react(), csp],
  server: { port: 5190, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
})
