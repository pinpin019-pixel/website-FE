// KAN-9: xử lý chuỗi cho các khối trang chủ

// Giữ tối đa `max` từ đầu; dài hơn thì cắt và thêm "…". Không dài hơn thì trả nguyên chuỗi.
export function truncateWords(text, max = 50) {
  if (typeof text !== 'string') return '';
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= max) return text;
  return `${words.slice(0, max).join(' ')}…`;
}
