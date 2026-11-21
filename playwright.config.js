import { defineConfig, devices } from '@playwright/test';

// E2E chạy trên hệ thống đầy đủ: backend (website-BE) phải đang chạy ở cổng 3001.
// Frontend được tự bật nếu chưa chạy (dùng lại nếu đã chạy ở 5173).
export default defineConfig({
  testDir: 'e2e',
  timeout: 30000,
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
