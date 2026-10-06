import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Both builds forbid every network request from the page (connect-src 'none').
// Desktop: the packaged app runs from file:// and can keep scripts external.
const desktopCsp = `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`
// Web: one self-contained HTML file, so scripts are inline.
const webCsp = `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`

const csp = (policy: string): Plugin => ({
  name: 'uc-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}">`),
})

// The single file can't load public/ assets: inline the theme script, drop the favicon.
const inlinePublic: Plugin = {
  name: 'uc-inline-public',
  apply: 'build',
  transformIndexHtml: (html) =>
    html
      .replace('<script src="./theme-boot.js"></script>', `<script>${readFileSync('public/theme-boot.js', 'utf8')}</script>`)
      .replace(/\s*<link rel="icon"[^>]*>/, ''),
}

export default defineConfig(({ mode }) =>
  mode === 'web'
    ? {
        base: './',
        plugins: [react(), inlinePublic, csp(webCsp), viteSingleFile()],
        publicDir: false,
        build: { outDir: 'release/web', emptyOutDir: true },
      }
    : {
        base: './',
        plugins: [react(), csp(desktopCsp)],
        server: { port: 5190, strictPort: true },
        build: { outDir: 'dist', emptyOutDir: true },
      },
)
