import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api được chuyển tới backend (website-BE). Đổi địa chỉ bằng biến môi trường API_TARGET nếu cần.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': process.env.API_TARGET || 'http://localhost:3001' },
  },
  test: {
    include: ['src/**/*.test.{js,jsx}'],
  },
});
