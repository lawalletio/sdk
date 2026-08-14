import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import {
  createApiHandler,
  logAdminIdentity,
  readApiOptions
} from './server/api'

// The repo pins esbuild to a version that refuses to lower modern syntax
// (destructuring in nostr-tools / @noble) to Vite's default safari14-era
// targets. An example app only needs current browsers.
const TARGET = 'es2022'

/** Public instance, so the example runs with no configuration at all. */
const PUBLIC_ENDPOINT = 'https://beta.lawallet.io'

function resolveEndpoint(env: Record<string, string>): string {
  return (
    env.LAWALLET_ENDPOINT ||
    env.VITE_LAWALLET_ENDPOINT ||
    PUBLIC_ENDPOINT
  ).replace(/\/+$/, '')
}

/**
 * Mounts the operator backend into Vite itself — one process, one port, one
 * command, and no HTTP framework. The handler is a plain (req, res) function,
 * so production can mount the same file in Express/Fastify/node:http.
 */
function operatorBackend(env: Record<string, string>): Plugin {
  const options = readApiOptions(
    { ...process.env, ...env },
    resolveEndpoint(env),
    fileURLToPath(new URL('.env', import.meta.url))
  )
  const handler = createApiHandler(options)

  const mount = (server: { middlewares: { use: (fn: any) => void } }) => {
    void logAdminIdentity(options)
    server.middlewares.use(async (req: any, res: any, next: any) => {
      const handled = await handler(req, res).catch(error => {
        next(error)
        return true
      })
      if (!handled) next()
    })
  }

  return {
    name: 'lawallet-operator-backend',
    configureServer: mount,
    configurePreviewServer: mount
  }
}

export default defineConfig(({ mode }) => {
  // '' loads every var, not just VITE_-prefixed ones — the admin key is read
  // here in the Node process only, and never passed to `define`.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), operatorBackend(env)],
    build: { target: TARGET },
    optimizeDeps: { esbuildOptions: { target: TARGET } },
    define: {
      'import.meta.env.VITE_DEFAULT_ENDPOINT': JSON.stringify(
        resolveEndpoint(env)
      )
    }
  }
})
