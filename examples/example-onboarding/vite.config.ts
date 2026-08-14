import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/** Public instance, so the example runs with no configuration at all. */
const PUBLIC_ENDPOINT = 'https://beta.lawallet.io'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const endpoint = (
    env.VITE_LAWALLET_ENDPOINT ||
    env.LAWALLET_ENDPOINT ||
    PUBLIC_ENDPOINT
  ).replace(/\/+$/, '')

  return {
    plugins: [react()],
    build: { target: 'es2022' },
    define: {
      'import.meta.env.VITE_DEFAULT_ENDPOINT': JSON.stringify(endpoint)
    }
  }
})
