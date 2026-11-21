# website-FE

Frontend mẫu: màn hình sản phẩm (React + Vite), gọi API của [website-BE](https://github.com/pinpin019-pixel/website-BE) qua proxy `/api`.

## Chạy local

Cần Node.js 20+ và backend đang chạy ở `http://localhost:3001`.

```
npm ci
npm run dev        # http://localhost:5173
```

## Test

```
npm test           # unit test (Vitest)
npm run e2e        # Playwright trên hệ thống đầy đủ (backend phải đang chạy)
```

Lần đầu chạy Playwright trên máy: `npx playwright install chromium`.
