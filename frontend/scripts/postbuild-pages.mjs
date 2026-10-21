// GitHub Pages has no rewrite rules: any path it cannot map to a file (for
// example "/journeys/12") is answered with 404.html. Copying the built
// index.html there lets the React app boot and let React Router resolve the
// requested path instead of the visitor hitting a dead link.
import { access, copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const distDir = resolve(process.cwd(), 'dist')
const indexPath = resolve(distDir, 'index.html')
const notFoundPath = resolve(distDir, '404.html')

try {
  await access(indexPath)
} catch {
  console.error(`postbuild: ${indexPath} is missing — did "vite build" run?`)
  process.exit(1)
}

await copyFile(indexPath, notFoundPath)
console.log('postbuild: wrote dist/404.html (SPA fallback for GitHub Pages)')
