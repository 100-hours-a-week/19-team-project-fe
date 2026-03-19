import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const captureAllArtifacts = process.env.PW_CAPTURE_ALL === '1';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html']],
  use: {
    baseURL: BASE_URL,
    trace: captureAllArtifacts ? 'on' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: captureAllArtifacts ? 'on' : 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: isCI
      ? `NEXT_PUBLIC_DISABLE_SERVICE_WORKER=true pnpm build && NEXT_PUBLIC_DISABLE_SERVICE_WORKER=true pnpm start --hostname 127.0.0.1 --port ${PORT}`
      : `pnpm dev --webpack --hostname 127.0.0.1 --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: isCI ? 300 * 1000 : 120 * 1000,
  },
});
