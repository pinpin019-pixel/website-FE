// KAN-8: hero slider — tối đa 5 slide từ dữ liệu, tự chuyển, nút Trước/Sau, chấm, tạm dừng, rê chuột, vuốt.
// Tiêu đề slide hiện tại là h1 duy nhất của trang; slide khác dùng thẻ p.
import React, { useRef } from 'react';
import useCarousel from './useCarousel.js';
import { t } from '../i18n.js';
import { track } from './tracking.js';

export const MAX_SLIDES = 5;
export const DEFAULT_INTERVAL_MS = 6000;
const SWIPE_MIN_PX = 40;

export function heroSlides(content) {
  const list = Array.isArray(content?.slides) ? content.slides : [];
  return list.filter((s) => s && typeof s.title === 'string' && s.title.trim()).slice(0, MAX_SLIDES);
}

// Link từ dữ liệu: chỉ nhận http(s), mailto, tel hoặc đường dẫn không có scheme; còn lại → '#'
export function safeHref(href) {
  if (typeof href !== 'string' || !href.trim()) return '#';
  const scheme = href.replace(/[\u0000- ]/g, '').match(/^([a-z][a-z0-9+.-]*):/i);
  if (!scheme) return href;
  return ['http', 'https', 'mailto', 'tel'].includes(scheme[1].toLowerCase()) ? href : '#';
}

export function heroInterval(content) {
  const ms = content?.intervalMs;
  return typeof ms === 'number' && ms > 0 ? ms : DEFAULT_INTERVAL_MS;
}

export default function Hero({ content, lang }) {
  const slides = heroSlides(content);
  const c = useCarousel(slides.length, { intervalMs: heroInterval(content) });
  const touch = useRef(null);
  if (slides.length === 0) return null;
  const many = slides.length > 1;

  const onPointerEnter = (e) => { if (e.pointerType === 'mouse') c.pause('hover'); };
  const onPointerLeave = (e) => { if (e.pointerType === 'mouse') c.resume('hover'); };
  const onTouchStart = (e) => {
    const p = e.touches[0];
    touch.current = p ? { x: p.clientX, y: p.clientY } : null;
  };
  const onTouchEnd = (e) => {
    const start = touch.current;
    const p = e.changedTouches[0];
    touch.current = null;
    if (!start || !p) return;
    const dx = p.clientX - start.x;
    const dy = p.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) c.next(); else c.prev();
  };

  return (
    <section
      className="hero"
      aria-label={t(lang, 'heroRegion')}
      aria-roledescription="carousel"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="hero__track" style={{ transform: `translateX(-${c.index * 100}%)` }}>
        {slides.map((s, i) => {
          const active = i === c.index;
          const Title = active ? 'h1' : 'p';
          return (
            <div
              key={i}
              className={active ? 'hero__slide is-active' : 'hero__slide'}
              style={s.imageUrl ? { backgroundImage: `url(${JSON.stringify(s.imageUrl)})` } : undefined}
              aria-hidden={!active}
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${slides.length}`}
            >
              <div className="hero__inner">
                <div className="hero__text">
                  <Title className="hero__title">{s.title}</Title>
                  {s.description && <p className="hero__desc">{s.description}</p>}
                  {s.ctaLabel && (
                    <a
                      className="hero__cta"
                      href={safeHref(s.ctaHref)}
                      tabIndex={active ? undefined : -1}
                      onClick={() => track('cta_click', { label: s.ctaLabel, location: 'hero' })}
                    >
                      {s.ctaLabel}
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {many && (
        <>
          <button type="button" className="hero__nav hero__nav--prev" aria-label={t(lang, 'prevSlide')} onClick={c.prev}>
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" className="hero__nav hero__nav--next" aria-label={t(lang, 'nextSlide')} onClick={c.next}>
            <span aria-hidden="true">›</span>
          </button>
          <div className="hero__controls">
            <button
              type="button"
              className="hero__pause"
              aria-label={t(lang, c.paused ? 'playSlides' : 'pauseSlides')}
              onClick={c.togglePause}
            >
              <span aria-hidden="true">{c.paused ? '▶' : '❚❚'}</span>
            </button>
            <div className="hero__dots">
              {slides.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${t(lang, 'goToSlide')} ${i + 1}`}
                  aria-current={i === c.index ? 'true' : undefined}
                  onClick={() => c.goTo(i)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
