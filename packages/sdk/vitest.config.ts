import { defineConfig } from 'vitest/config'

/**
 * Two projects because the halves need different environments: the core client
 * is plain Node, the hooks need a DOM. `projects` is the supported mechanism in
 * Vitest 3 (`environmentMatchGlobs` is deprecated).
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'core',
          environment: 'node',
          setupFiles: ['./tests/setup.ts'],
          include: ['tests/*.test.ts']
        }
      },
      {
        test: {
          name: 'react',
          environment: 'happy-dom',
          // Required for @testing-library/react's automatic DOM cleanup.
          globals: true,
          setupFiles: ['./tests/react/setup.ts'],
          include: ['tests/react/*.test.tsx']
        }
      }
    ]
  }
})
