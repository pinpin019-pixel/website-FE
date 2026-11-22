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
    heroRegion: 'Highlights',
    prevSlide: 'Previous slide',
    nextSlide: 'Next slide',
    pauseSlides: 'Pause',
    playSlides: 'Play',
    goToSlide: 'Go to slide',
    clientsRegion: 'Our clients',
    prevLogos: 'Previous logos',
    nextLogos: 'Next logos',
    learnMore: 'Learn more',
    postsLoadError: 'This section is unavailable right now.',
    prevBand: 'Previous {label}',
    nextBand: 'Next {label}',
    testimonialTabs: 'Customers',
    playVideo: 'Play video',
    chat: 'Chat',
    closeGreeting: 'Close greeting',
    backToTop: 'Back to top',
    cookieRegion: 'Cookie consent',
    cookieMessage: 'We use cookies to measure how this page is used. You can accept or reject analytics cookies.',
    cookieAccept: 'Accept',
    cookieReject: 'Reject',
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
    heroRegion: 'Nổi bật',
    prevSlide: 'Slide trước',
    nextSlide: 'Slide sau',
    pauseSlides: 'Tạm dừng',
    playSlides: 'Tiếp tục',
    goToSlide: 'Tới slide',
    clientsRegion: 'Khách hàng tiêu biểu',
    prevLogos: 'Logo trước',
    nextLogos: 'Logo sau',
    learnMore: 'Xem thêm',
    postsLoadError: 'Hiện chưa tải được mục này.',
    prevBand: '{label} trước',
    nextBand: '{label} sau',
    testimonialTabs: 'Khách hàng',
    playVideo: 'Phát video',
    chat: 'Trò chuyện',
    closeGreeting: 'Đóng lời chào',
    backToTop: 'Lên đầu trang',
    cookieRegion: 'Đồng ý cookie',
    cookieMessage: 'Chúng tôi dùng cookie để đo lường cách trang này được sử dụng. Bạn có thể đồng ý hoặc từ chối cookie phân tích.',
    cookieAccept: 'Đồng ý',
    cookieReject: 'Từ chối',
  },
};

export function t(lang, key) {
  return STRINGS[lang]?.[key] ?? STRINGS[DEFAULT_LANG][key] ?? key;
}

const pad = (n) => String(n).padStart(2, '0');

// KAN-10 (FR-08.3): en "November 18, 2026"; vi "18/11/2026"; ja "2026年11月18日"; ko "2026년 11월 18일"
const DATE_FORMATS = {
  en: new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  ja: new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }),
  ko: new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
};

// Chuỗi chỉ có ngày "YYYY-MM-DD" hiểu là ngày theo giờ máy (new Date() hiểu là 00:00 UTC, lệch ngày ở múi giờ âm)
function toDate(x) {
  if (x instanceof Date) return x;
  if (typeof x === 'string') {
    const m = x.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Date(x);
  }
  return new Date(NaN);
}

// Ngôn ngữ lạ → định dạng en. Giá trị không phải ngày → ''.
export function formatDate(date, lang) {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return '';
  if (lang === 'vi') return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return (DATE_FORMATS[lang] || DATE_FORMATS.en).format(d);
}
