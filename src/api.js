// Gọi API backend (qua proxy /api của Vite)
async function handle(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Lỗi ${res.status}`);
    err.errors = body.errors || {};
    throw err;
  }
  return body;
}

export const listProducts = () => fetch('/api/products').then(handle);

export const createProduct = (product) => fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(product),
}).then(handle);
