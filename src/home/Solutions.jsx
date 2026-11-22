// KAN-9: khối Solutions — cột trái (nhãn, tiêu đề, giới thiệu, nút) dính khi cuộn ở ≥ 992px;
// cột phải các thẻ giải pháp, mô tả cắt 50 từ. < 992px: thẻ xếp dọc dưới đoạn giới thiệu.
import React from 'react';
import { safeHref } from './Hero.jsx';
import { truncateWords } from './text.js';
import { t } from '../i18n.js';

export const DESCRIPTION_MAX_WORDS = 50;

export function solutionCards(content) {
  const list = Array.isArray(content?.cards) ? content.cards : [];
  return list
    .filter((c) => c && typeof c.title === 'string' && c.title.trim())
    .map((c) => ({
      title: c.title,
      description: truncateWords(c.description, DESCRIPTION_MAX_WORDS),
      imageUrl: c.imageUrl,
      href: safeHref(c.href),
    }));
}

export default function Solutions({ content, lang }) {
  const cards = solutionCards(content);
  const c = content || {};
  return (
    <section className="solutions" aria-labelledby="solutions-title">
      <div className="solutions__inner">
        <div className="solutions__intro">
          {c.label && <div className="section-label solutions__label">{c.label}</div>}
          <h2 id="solutions-title" className="section-title">{c.title}</h2>
          {c.intro && <p className="solutions__text">{c.intro}</p>}
          {c.ctaLabel && (
            <a className="btn btn--navy" href={safeHref(c.ctaHref)}>{c.ctaLabel}</a>
          )}
        </div>
        <div className="solutions__cards">
          {cards.map((card, i) => (
            <article className="solutions__card" key={`${i}-${card.title}`}>
              <h3>{card.title}</h3>
              {card.description && <p>{card.description}</p>}
              {card.imageUrl && <img src={card.imageUrl} alt={card.title} loading="lazy" />}
              <a className="solutions__more" href={card.href}>{t(lang, 'learnMore')} <span aria-hidden="true">›</span></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
