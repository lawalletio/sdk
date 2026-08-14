import { defineConfig } from 'tsup'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'

/**
 * ONE build with both entries and code splitting, so the core is emitted once
 * and shared. Two separate builds cannot share chunks: the React entry would
 * inline its own copy of the client, and a consumer importing `LaWalletClient`
 * from `@lawallet/sdk` and the provider from `@lawallet/sdk/react` would end up
 * with two distinct module instances — `instanceof LaWalletError` would start
 * returning false across that boundary.
 *
 * `'use client'` is applied afterwards to the React entry only: esbuild strips
 * source-level directives when bundling, and tsup's `banner` is global, which
 * would stamp it onto the Node-safe core entry too.
 */
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'react/index': 'src/react/index.ts'
  },
  outDir: 'dist',
  format: ['esm'],
  target: 'es2020',
  platform: 'neutral',
  splitting: true,
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react'],
  async onSuccess() {
    const entry = 'dist/react/index.js'
    const source = readFileSync(entry, 'utf8')
    if (!source.startsWith("'use client'")) {
      writeFileSync(entry, `'use client';\n${source}`)
    }
  }
})
