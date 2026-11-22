// KAN-12: khối CTA cuối trang (FR-10.1) — tiêu đề và nút "Let's Chat!" tới trang Liên hệ, nội dung từ dữ liệu.
import React from 'react';
import { safeHref } from './Hero.jsx';
import { track } from './tracking.js';

const text = (x) => (typeof x === 'string' ? x.trim() : '');

// null khi không có gì để hiển thị
export function ctaContent(content) {
  const title = text(content?.title);
  const label = text(content?.ctaLabel);
  if (!title && !label) return null;
  return { title, label, href: safeHref(content?.ctaHref) };
}

export default function Cta({ content }) {
  const c = ctaContent(content);
  if (!c) return null;
  return (
    <section className="cta" aria-labelledby={c.title ? 'cta-title' : undefined}>
      <div className="cta__inner">
        {c.title && <h2 id="cta-title" className="cta__title">{c.title}</h2>}
        {c.label && (
          <a
            className="btn btn--cyan cta__btn"
            href={c.href}
            onClick={() => track('cta_click', { label: c.label, location: 'cta' })}
          >
            {c.label} <span className="cta__arrow" aria-hidden="true">›</span>
          </a>
        )}
      </div>
    </section>
  );
}
