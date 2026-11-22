// KAN-12: thành phần nổi (FR-12) — nút chat cố định góc dưới phải kèm lời chào đóng được, nút Back to top.
// Lời chào lấy từ floating.chatGreeting; dưới 768px tự ẩn sau 5 giây.
// Nút chat chưa mở hệ thống chat nào (giả định A-05); sự kiện chat_open gắn ở story đo lường.
import React, { useEffect, useState } from 'react';
import { t } from '../i18n.js';
import { track } from './tracking.js';

export const GREETING_AUTOHIDE_MS = 5000;
const MOBILE_MAX_WIDTH = 767;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export function chatGreeting(content) {
  const g = content?.chatGreeting;
  return typeof g === 'string' ? g.trim() : '';
}

export function greetingAutoHides(viewportWidth) {
  return viewportWidth <= MOBILE_MAX_WIDTH;
}

export function showBackToTop(scrollY, viewportHeight) {
  return scrollY > viewportHeight;
}

function prefersReducedMotion() {
  return !!window.matchMedia && window.matchMedia(REDUCED_MOTION).matches;
}

function useBackToTopVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(showBackToTop(window.scrollY, window.innerHeight));
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return visible;
}

export default function Floating({ content, lang }) {
  const greeting = chatGreeting(content);
  const [greetingOpen, setGreetingOpen] = useState(true);
  const toTopVisible = useBackToTopVisible();

  useEffect(() => {
    if (!greeting || !greetingAutoHides(window.innerWidth)) return undefined;
    const id = setTimeout(() => setGreetingOpen(false), GREETING_AUTOHIDE_MS);
    return () => clearTimeout(id);
  }, [greeting]);

  const toTop = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

  return (
    <div className="floating">
      <button
        type="button"
        className={`to-top${toTopVisible ? ' to-top--show' : ''}`}
        aria-label={t(lang, 'backToTop')}
        onClick={toTop}
      >
        <span aria-hidden="true">↑</span>
      </button>
      {greeting && greetingOpen && (
        <div className="chat-greeting" role="status">
          <p className="chat-greeting__text">{greeting}</p>
          <button
            type="button"
            className="chat-greeting__close"
            aria-label={t(lang, 'closeGreeting')}
            onClick={() => setGreetingOpen(false)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}
      <button type="button" className="chat-btn" aria-label={t(lang, 'chat')} onClick={() => track('chat_open')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  );
}
