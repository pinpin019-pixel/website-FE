// KAN-8: Hero — chọn slide từ dữ liệu (tối đa 5), thời gian tự chuyển, chuỗi giao diện
import { describe, expect, test } from 'vitest';
import { heroInterval, heroSlides } from './Hero.jsx';
import { t } from '../i18n.js';

const slide = (n) => ({ title: `T${n}`, description: `D${n}`, ctaLabel: 'Go', ctaHref: '#', imageUrl: `https://x/${n}.png` });

describe('KAN-8 heroSlides', () => {
  test('giữ nguyên thứ tự khi ≤ 5 slide', () => {
    const s = [slide(1), slide(2)];
    expect(heroSlides({ slides: s })).toEqual(s);
  });
  test('hơn 5 slide → chỉ 5 slide đầu (FR-02.1)', () => {
    const s = [1, 2, 3, 4, 5, 6, 7].map(slide);
    expect(heroSlides({ slides: s }).map((x) => x.title)).toEqual(['T1', 'T2', 'T3', 'T4', 'T5']);
  });
  test('bỏ slide không có tiêu đề trước khi cắt 5', () => {
    const s = [slide(1), { ...slide(2), title: '' }, null, slide(3), slide(4), slide(5), slide(6), slide(7)];
    expect(heroSlides({ slides: s }).map((x) => x.title)).toEqual(['T1', 'T3', 'T4', 'T5', 'T6']);
  });
  test('thiếu dữ liệu → mảng rỗng', () => {
    expect(heroSlides(undefined)).toEqual([]);
    expect(heroSlides({})).toEqual([]);
    expect(heroSlides({ slides: 'x' })).toEqual([]);
  });
});

describe('KAN-8 heroInterval', () => {
  test('mặc định 6000 ms; dùng intervalMs dương từ dữ liệu', () => {
    expect(heroInterval(undefined)).toBe(6000);
    expect(heroInterval({})).toBe(6000);
    expect(heroInterval({ intervalMs: 0 })).toBe(6000);
    expect(heroInterval({ intervalMs: 'abc' })).toBe(6000);
    expect(heroInterval({ intervalMs: 8000 })).toBe(8000);
  });
});

describe('KAN-8 chuỗi giao diện carousel', () => {
  test('en: nút trước/sau, tạm dừng/tiếp tục, chấm, nhãn vùng', () => {
    expect(t('en', 'prevSlide')).toBe('Previous slide');
    expect(t('en', 'nextSlide')).toBe('Next slide');
    expect(t('en', 'pauseSlides')).toBe('Pause');
    expect(t('en', 'playSlides')).toBe('Play');
    expect(t('en', 'goToSlide')).toBe('Go to slide');
    expect(t('en', 'heroRegion')).toBe('Highlights');
    expect(t('en', 'clientsRegion')).toBe('Our clients');
    expect(t('en', 'prevLogos')).toBe('Previous logos');
    expect(t('en', 'nextLogos')).toBe('Next logos');
  });
  test('vi có bản dịch; ko dùng chuỗi en', () => {
    expect(t('vi', 'pauseSlides')).toBe('Tạm dừng');
    expect(t('vi', 'playSlides')).toBe('Tiếp tục');
    expect(t('vi', 'prevSlide')).toBe('Slide trước');
    expect(t('ko', 'playSlides')).toBe('Play');
  });
});
