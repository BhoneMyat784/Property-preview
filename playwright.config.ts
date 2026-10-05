import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command:
      "node --import tsx server/seed.ts && node --import tsx server/index.ts",
    url: "http://localhost:3100/api/v1/health",
    reuseExistingServer: false,
    timeout: 30000,
    env: {
      DATA_DIR: path.resolve(".local/e2e"),
      PORT: "3100",
      HOST: "127.0.0.1",
      APP_URL: "http://localhost:3100",
      API_URL: "http://localhost:3100",
      INTERNAL_API_URL: "http://localhost:3100",
      SERVE_WEB: "true",
      NODE_ENV: "test",
      BETTER_AUTH_SECRET: "e2e-only-secret-with-at-least-thirty-two-characters",
    },
  },
});
