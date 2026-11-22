// KAN-7: footer trang chủ — 8 cột liên kết, mạng xã hội, liên hệ (khi có dữ liệu), bản quyền
import React from 'react';
import { t } from '../i18n.js';

export function copyrightText(year, company) {
  return `Copyright ©${year} ${company || 'CMC Global'}. All rights reserved.`;
}

const CONTACT_KEYS = ['address', 'email', 'phone'];

// Chỉ các trường liên hệ có giá trị (bỏ chuỗi rỗng/khoảng trắng), theo thứ tự cố định
export function contactItems(content) {
  return CONTACT_KEYS
    .map((key) => ({ key, value: typeof content?.[key] === 'string' ? content[key].trim() : '' }))
    .filter((x) => x.value);
}

const SOCIAL_ICON = { Facebook: 'f', YouTube: '▶', LinkedIn: 'in' };

function ContactValue({ item }) {
  if (item.key === 'email') return <a href={`mailto:${item.value}`}>{item.value}</a>;
  if (item.key === 'phone') return <a href={`tel:${item.value.replace(/\s+/g, '')}`}>{item.value}</a>;
  return item.value;
}

export default function Footer({ content, lang }) {
  const columns = content?.columns || [];
  const social = content?.social || [];
  const contact = contactItems(content);
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          {columns.map((col) => (
            <div className="site-footer__col" key={col.title}>
              <p className="site-footer__title">{col.title}</p>
              {(col.links || []).map((l) => <a key={l.label} href={l.href || '#'}>{l.label}</a>)}
            </div>
          ))}
        </div>
        {contact.length > 0 && (
          <ul className="site-footer__contact">
            {contact.map((c) => (
              <li key={c.key}>
                <span className="site-footer__contact-label">{t(lang, c.key)}:</span> <ContactValue item={c} />
              </li>
            ))}
          </ul>
        )}
        <div className="site-footer__bottom">
          <div className="site-footer__social">
            {social.map((s) => (
              <a key={s.name} href={s.href || '#'} aria-label={s.name} target="_blank" rel="noopener noreferrer">
                <span aria-hidden="true">{SOCIAL_ICON[s.name] ?? s.name.charAt(0)}</span>
              </a>
            ))}
          </div>
          <p className="site-footer__copyright">{copyrightText(new Date().getFullYear(), content?.company)}</p>
        </div>
      </div>
    </footer>
  );
}
