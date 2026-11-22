import React, { useEffect, useState } from 'react';
import { createProduct, listProducts } from '../api.js';
import { formatPrice } from '../format.js';

// Màn hình Sản phẩm (trước ở App.jsx, KAN-6 chuyển sang /products)
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ name: '', price: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch(() => setLoadError('Không tải được danh sách sản phẩm'))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const created = await createProduct({ name: form.name, price: form.price === '' ? '' : Number(form.price) });
      setProducts((list) => [...list, created]);
      setForm({ name: '', price: '' });
    } catch (err) {
      setErrors(Object.keys(err.errors || {}).length ? err.errors : { form: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <h1>Sản phẩm</h1>

      <form onSubmit={onSubmit} aria-label="Thêm sản phẩm">
        <label>
          Tên sản phẩm
          <input name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        {errors.name && <p className="error" role="alert">{errors.name}</p>}
        <label>
          Giá (₫)
          <input name="price" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </label>
        {errors.price && <p className="error" role="alert">{errors.price}</p>}
        {errors.form && <p className="error" role="alert">{errors.form}</p>}
        <button type="submit" disabled={saving}>{saving ? 'Đang lưu…' : 'Thêm sản phẩm'}</button>
      </form>

      {loading && <p>Đang tải…</p>}
      {loadError && <p className="error" role="alert">{loadError}</p>}
      {!loading && !loadError && (
        <table aria-label="Danh sách sản phẩm">
          <thead><tr><th>#</th><th>Tên</th><th>Giá</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{formatPrice(p.price)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
