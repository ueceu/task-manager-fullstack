import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./runtime-tests",
  timeout: 180000,
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    launchOptions: {
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    },
  },
});
