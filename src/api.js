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

// KAN-6: nội dung trang chủ { lang, blocks: [{ key, lang, content }] }
export const getHome = (lang) => fetch(`/api/home?lang=${encodeURIComponent(lang)}`).then(handle);

// KAN-10: bài viết [{ id, type, lang, title, excerpt, imageUrl, url, pinned, publishedAt }]
export const listPosts = ({ type, limit, lang }) => {
  const q = new URLSearchParams({ type, limit: String(limit), lang });
  return fetch(`/api/posts?${q}`).then(handle);
};

export const createProduct = (product) => fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(product),
}).then(handle);
