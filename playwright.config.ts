import { defineConfig } from '@playwright/test'

const baseURL = 'http://127.0.0.1:32064'

export default defineConfig({
  testDir: './e2e',
  workers: 2,
  use: {
    baseURL,
    browserName: 'chromium',
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'node e2e/start-server.mjs',
    env: { SMOKE_BASE_URL: baseURL },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
