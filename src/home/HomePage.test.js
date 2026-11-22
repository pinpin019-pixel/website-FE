// KAN-6: chọn khối dựng theo BLOCK_COMPONENTS, lấy nội dung seo
import { describe, expect, test } from 'vitest';
import { BLOCK_COMPONENTS, floatingOf, renderableBlocks, seoOf } from './HomePage.jsx';
import Cta from './Cta.jsx';

const Fake = () => null;

describe('KAN-6 renderableBlocks', () => {
  test('chỉ giữ khối có component, giữ nguyên thứ tự', () => {
    const blocks = [
      { key: 'b', lang: 'en', content: {} },
      { key: 'unknown', lang: 'en', content: {} },
      { key: 'a', lang: 'en', content: {} },
    ];
    expect(renderableBlocks(blocks, { a: Fake, b: Fake }).map((x) => x.key)).toEqual(['b', 'a']);
  });
  test('khối seo không có component nên không dựng; danh sách rỗng/thiếu không lỗi', () => {
    expect(BLOCK_COMPONENTS.seo).toBeUndefined();
    expect(renderableBlocks([{ key: 'seo', lang: 'en', content: {} }])).toEqual([]);
    expect(renderableBlocks(undefined)).toEqual([]);
  });
});

describe('KAN-12 cta, floating', () => {
  test('cta dựng theo thứ tự khối bằng Cta; floating không dựng theo thứ tự khối', () => {
    expect(BLOCK_COMPONENTS.cta).toBe(Cta);
    expect(BLOCK_COMPONENTS.floating).toBeUndefined();
    const blocks = [
      { key: 'testimonials', content: {} }, { key: 'cta', content: {} },
      { key: 'footer', content: {} }, { key: 'floating', content: {} },
    ];
    expect(renderableBlocks(blocks).map((b) => b.key)).toEqual(['testimonials', 'cta', 'footer']);
  });
  test('floatingOf trả content của khối floating, không có → null', () => {
    const content = { chatGreeting: 'Hi' };
    expect(floatingOf([{ key: 'cta', content: {} }, { key: 'floating', content }])).toEqual(content);
    expect(floatingOf([{ key: 'cta', content: {} }])).toBeNull();
    expect(floatingOf(undefined)).toBeNull();
  });
});

describe('KAN-6 seoOf', () => {
  test('trả content của khối seo', () => {
    const content = { title: 'T', description: 'D' };
    expect(seoOf([{ key: 'hero', content: {} }, { key: 'seo', lang: 'en', content }])).toEqual(content);
  });
  test('không có khối seo → null', () => {
    expect(seoOf([{ key: 'hero', content: {} }])).toBeNull();
    expect(seoOf(undefined)).toBeNull();
  });
});
