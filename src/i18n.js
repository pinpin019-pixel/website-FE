// Ngôn ngữ trang chủ, chuỗi giao diện cố định, định dạng ngày
export const SUPPORTED = ['en', 'vi', 'ja', 'ko'];
export const DEFAULT_LANG = 'en';
export const LANG_STORAGE_KEY = 'lang';

export function normalizeLang(x) {
  return SUPPORTED.includes(x) ? x : DEFAULT_LANG;
}

// Ưu tiên query ?lang=, rồi localStorage, mặc định en; giá trị lạ → en
export function resolveLang(query, stored) {
  if (query) return normalizeLang(query);
  if (stored) return normalizeLang(stored);
  return DEFAULT_LANG;
}

export function readStoredLang() {
  try { return localStorage.getItem(LANG_STORAGE_KEY); } catch { return null; }
}

export function storeLang(lang) {
  try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch { /* trình duyệt chặn storage */ }
}

const STRINGS = {
  en: {
    loading: 'Loading…',
    homeLoadError: 'Sorry, we couldn’t load this page right now. Please try again later.',
    menu: 'Menu',
    mainNav: 'Main navigation',
    language: 'Language',
    address: 'Address',
    email: 'Email',
    phone: 'Phone',
  },
  vi: {
    loading: 'Đang tải…',
    homeLoadError: 'Xin lỗi, hiện chưa tải được trang. Vui lòng thử lại sau.',
    menu: 'Menu',
    mainNav: 'Điều hướng chính',
    language: 'Ngôn ngữ',
    address: 'Địa chỉ',
    email: 'Email',
    phone: 'Điện thoại',
  },
};

export function t(lang, key) {
  return STRINGS[lang]?.[key] ?? STRINGS[DEFAULT_LANG][key] ?? key;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

// vi: dd/mm/yyyy; ngôn ngữ khác: "Nov 22, 2026". Giá trị không phải ngày → ''.
export function formatDate(date, lang) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  if (lang === 'vi') return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
