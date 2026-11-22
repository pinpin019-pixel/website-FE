// KAN-11: ba dải logo Awards / Certificates / Partners — mỗi dải một khối riêng của /api/home.
// 5 logo/khung ở ≥ 1200px, 4 ở 768–1199px, 2 ở < 768px; mũi tên Trước/Sau dịch 1 logo, quay vòng; không tự chuyển.
import React, { useEffect, useState } from 'react';
import useCarousel from './useCarousel.js';
import { positionsFor, visibleLogos } from './ClientStrip.jsx';
import { t } from '../i18n.js';

const BREAKPOINTS = [1200, 768]; // giảm dần

export function perViewForWidth(width) {
  if (width >= 1200) return 5;
  if (width >= 768) return 4;
  return 2;
}

// Chỉ logo có tên (alt) và ảnh
export const bandLogos = visibleLogos;

export function arrowLabels(lang, label) {
  return {
    prev: t(lang, 'prevBand').replace('{label}', label),
    next: t(lang, 'nextBand').replace('{label}', label),
  };
}

// Mốc bề rộng lớn nhất màn hình đang đạt (1200, 768 hoặc 0), theo media query như CSS
function useMinWidth() {
  const get = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return BREAKPOINTS[0];
    return BREAKPOINTS.find((w) => window.matchMedia(`(min-width: ${w}px)`).matches) ?? 0;
  };
  const [width, setWidth] = useState(get);
  useEffect(() => {
    const queries = BREAKPOINTS.map((w) => window.matchMedia(`(min-width: ${w}px)`));
    const onChange = () => setWidth(get());
    onChange();
    queries.forEach((q) => q.addEventListener('change', onChange));
    return () => queries.forEach((q) => q.removeEventListener('change', onChange));
  }, []);
  return width;
}

function LogoBand({ blockKey, content, lang }) {
  const logos = bandLogos(content);
  const perView = perViewForWidth(useMinWidth());
  const c = useCarousel(positionsFor(logos.length, perView), { autoplay: false });
  if (logos.length === 0) return null;
  const label = typeof content?.label === 'string' && content.label.trim() ? content.label : blockKey;
  const arrows = arrowLabels(lang, label);
  const labelId = `logo-band-${blockKey}`;

  return (
    <section className={`logo-band logo-band--${blockKey}`} aria-labelledby={labelId} style={{ '--per-view': perView }}>
      <div className="logo-band__inner">
        <h2 id={labelId} className="section-label logo-band__label">{label}</h2>
        <div className="logo-band__row">
          <button type="button" className="logo-band__nav" aria-label={arrows.prev} onClick={c.prev}>
            <span aria-hidden="true">←</span>
          </button>
          <div className="logo-band__view">
            <ul className="logo-band__track" style={{ transform: `translateX(-${(c.index * 100) / perView}%)` }}>
              {logos.map((l, i) => (
                <li className="logo-band__item" key={`${i}-${l.imageUrl}`}>
                  <div className="logo-band__box">
                    <img src={l.imageUrl} alt={l.name} loading="lazy" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <button type="button" className="logo-band__nav" aria-label={arrows.next} onClick={c.next}>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export function Awards(props) { return <LogoBand blockKey="awards" {...props} />; }
export function Certificates(props) { return <LogoBand blockKey="certificates" {...props} />; }
export function Partners(props) { return <LogoBand blockKey="partners" {...props} />; }
