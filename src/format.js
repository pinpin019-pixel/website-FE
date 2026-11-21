// Định dạng giá tiền kiểu Việt Nam: 150000 -> "150.000 ₫"
export function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`;
}
