// Regenerates src/demo/images.js from backend/src/db/seed.js so the static
// GitHub Pages demo shows exactly the same journey photos as the real API.
//
// The three image constants are plain object literals; they are read from the
// seed source and evaluated in isolation (the seed file itself opens a database
// connection, so it cannot simply be imported here).
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')
const seedPath = resolve(repoRoot, 'backend/src/db/seed.js')
const outPath = resolve(here, '../src/demo/images.js')

const source = await readFile(seedPath, 'utf8')

// Returns the object literal assigned to `const <name> = { ... }`.
function objectLiteral(name) {
  const match = new RegExp(`const ${name} = \\{`).exec(source)
  if (!match) throw new Error(`${name} not found in ${seedPath}`)

  let depth = 0
  for (let index = match.index + match[0].length - 1; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') {
      depth -= 1
      if (depth === 0) return source.slice(match.index + match[0].length - 1, index + 1)
    }
  }
  throw new Error(`unbalanced object literal for ${name}`)
}

function readObject(name) {
  return new Function(`return (${objectLiteral(name)})`)()
}

const images = readObject('JOURNEY_IMAGES')
const gallery = readObject('JOURNEY_GALLERY')
const extra = readObject('EXTRA_IMAGE_MAP')

const output = `// Journey artwork for the static demo, generated from backend/src/db/seed.js
// so the published site shows the same Wikimedia Commons photos as the API.
// Regenerate with: node frontend/scripts/sync-demo-images.mjs

export const JOURNEY_IMAGES = ${JSON.stringify(images, null, 2)}

export const JOURNEY_GALLERY = ${JSON.stringify(gallery, null, 2)}

export const EXTRA_IMAGE_MAP = ${JSON.stringify(extra, null, 2)}
`

await writeFile(outPath, output)
console.log(
  `sync-demo-images: wrote ${outPath} (${Object.keys(images).length} flagship, ` +
    `${Object.keys(extra).length} extra, ${Object.keys(gallery).length} galleries)`,
)
