// KAN-7: Footer — dòng bản quyền, thông tin liên hệ chỉ hiện khi có dữ liệu
import { describe, expect, test } from 'vitest';
import { contactItems, copyrightText } from './Footer.jsx';

describe('KAN-7 copyrightText', () => {
  test('đúng mẫu với năm và tên công ty', () => {
    expect(copyrightText(2027, 'CMC Global')).toBe('Copyright ©2027 CMC Global. All rights reserved.');
  });
  test('thiếu tên công ty → CMC Global', () => {
    expect(copyrightText(2026)).toBe('Copyright ©2026 CMC Global. All rights reserved.');
    expect(copyrightText(2026, '')).toBe('Copyright ©2026 CMC Global. All rights reserved.');
  });
});

describe('KAN-7 contactItems', () => {
  test('dữ liệu trống hoặc thiếu → không có mục nào', () => {
    expect(contactItems({})).toEqual([]);
    expect(contactItems({ address: '', email: '  ', phone: null })).toEqual([]);
    expect(contactItems(undefined)).toEqual([]);
  });
  test('chỉ trả mục có giá trị, theo thứ tự địa chỉ, email, điện thoại', () => {
    expect(contactItems({ phone: '+84 24 1234 5678', email: 'info@example.com' })).toEqual([
      { key: 'email', value: 'info@example.com' },
      { key: 'phone', value: '+84 24 1234 5678' },
    ]);
    expect(contactItems({ address: ' Hà Nội ', email: '', phone: '1' }).map((x) => x.key)).toEqual(['address', 'phone']);
    expect(contactItems({ address: ' Hà Nội ' })[0].value).toBe('Hà Nội');
  });
});
