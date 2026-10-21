import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // GitHub Pages serves a project site from a sub-path (e.g. "/Nsafro/"), so the
  // built asset URLs have to be prefixed with it. Local dev keeps "/".
  const base = env.VITE_BASE_PATH || '/'

  return {
    base,
    plugins: [react()],
    server: {
      proxy: {
        '/api': 'http://localhost:4000',
      },
    },
  }
})
