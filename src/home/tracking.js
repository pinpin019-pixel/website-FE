// KAN-13 (FR-13): đồng ý cookie và sự kiện đo lường dataLayer.
// Chỉ khi người dùng đã Accept mới đẩy sự kiện vào window.dataLayer và nạp GTM (nếu có VITE_GTM_ID).
// Các hàm nhận `env` để test không cần DOM; mặc định dùng window, document, localStorage của trình duyệt.

export const CONSENT_KEY = 'cookie_consent';
export const CONSENT_ACCEPTED = 'accepted';
export const CONSENT_REJECTED = 'rejected';
export const SCROLL_MARKS = [25, 50, 75, 100];
export const GTM_SCRIPT_ID = 'gtm-script';
export const GTM_ID = (import.meta.env?.VITE_GTM_ID || '').trim();

// Trình duyệt có thể dừng cuộn thiếu 1–2px ở cuối trang
const BOTTOM_TOLERANCE_PX = 2;

function browserStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

// 'accepted' | 'rejected' | null (chưa chọn, giá trị lạ, storage bị chặn)
export function readConsent(storage = browserStorage()) {
  try {
    const v = storage?.getItem(CONSENT_KEY);
    return v === CONSENT_ACCEPTED || v === CONSENT_REJECTED ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(value, storage = browserStorage()) {
  try { storage?.setItem(CONSENT_KEY, value); } catch { /* trình duyệt chặn storage */ }
}

// Đẩy { event, ...params } vào dataLayer khi đã Accept; trả true nếu đã đẩy
export function track(event, params, { win = globalThis.window, storage = browserStorage() } = {}) {
  if (!win || readConsent(storage) !== CONSENT_ACCEPTED) return false;
  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push({ ...(params || {}), event });
  return true;
}

// Phần trăm trang đã thấy (đáy màn hình so với chiều cao trang), 0–100
export function scrollPercent(scrollY, viewportHeight, pageHeight) {
  const seen = scrollY + viewportHeight;
  if (pageHeight <= 0 || seen >= pageHeight - BOTTOM_TOLERANCE_PX) return 100;
  return Math.min(100, Math.floor((seen / pageHeight) * 100));
}

// Mỗi mốc gửi tối đa một lần; mốc chỉ tính là đã gửi khi send trả true (đã đồng ý)
export function createScrollDepthTracker(send = track) {
  const sent = new Set();
  return (percent) => {
    for (const mark of SCROLL_MARKS) {
      if (percent < mark) break;
      if (sent.has(mark)) continue;
      if (send('scroll_depth', { percent: mark })) sent.add(mark);
    }
  };
}

export function gtmSrc(id) {
  return `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
}

// Chèn script GTM một lần; không có id → không làm gì. Trả true nếu vừa chèn.
export function loadGtm(id = GTM_ID, { doc = globalThis.document, win = globalThis.window } = {}) {
  const gtmId = typeof id === 'string' ? id.trim() : '';
  if (!gtmId || !doc || !win || doc.getElementById(GTM_SCRIPT_ID)) return false;
  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = doc.createElement('script');
  s.id = GTM_SCRIPT_ID;
  s.async = true;
  s.src = gtmSrc(gtmId);
  doc.head.appendChild(s);
  return true;
}
