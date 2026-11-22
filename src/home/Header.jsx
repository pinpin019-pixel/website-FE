// KAN-7: header trang chủ — logo, menu cấp 1, mega menu, chọn ngôn ngữ, hamburger dưới 992px
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { storeLang, t } from '../i18n.js';
import { track } from './tracking.js';

const menuClick = (label) => track('menu_click', { label });

// Bản sao query hiện tại với lang mới; giữ nguyên các tham số khác
export function withLang(search, code) {
  const p = new URLSearchParams(search);
  p.set('lang', code);
  return p;
}

export function hasSubmenu(item) {
  return Array.isArray(item?.columns) && item.columns.some((c) => c?.links?.length > 0);
}

// Mega menu: nhiều nhóm và nhóm nào cũng có tiêu đề (Services); còn lại là menu thả dọc
function isMega(item) {
  return item.columns.length > 1 && item.columns.every((c) => c.title);
}

function Submenu({ item, open, onToggle }) {
  const cls = ['nav__item', 'nav__item--has-panel', isMega(item) && 'nav__item--mega', open && 'is-open']
    .filter(Boolean).join(' ');
  return (
    <li className={cls}>
      <button type="button" className="nav__top" aria-expanded={open} onClick={() => { menuClick(item.label); onToggle(); }}>
        {item.label}
        <span className="nav__caret" aria-hidden="true" />
      </button>
      <div className="nav__panel">
        {item.columns.map((col, i) => (
          <div className="nav__group" key={col.title || i}>
            {col.title && <p className="nav__group-title">{col.title}</p>}
            {(col.links || []).map((l) => (
              <a key={l.label} href={l.href || '#'} onClick={() => menuClick(l.label)}>{l.label}</a>
            ))}
          </div>
        ))}
      </div>
    </li>
  );
}

export default function Header({ content, lang }) {
  const [params, setParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openItem, setOpenItem] = useState(null);
  const menu = content?.menu || [];
  const languages = content?.languages || [];
  const logo = content?.logo || {};

  function changeLang(e) {
    const code = e.target.value;
    if (code !== lang) track('language_change', { from: lang, to: code });
    storeLang(code);
    setParams(withLang(params, code));
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-header__logo">
          <img src={logo.imageUrl} alt={logo.alt || 'CMC Global'} height="40" />
        </Link>
        <button
          type="button"
          className="site-header__burger"
          aria-label={t(lang, 'menu')}
          aria-expanded={menuOpen}
          aria-controls="site-nav-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <nav className="nav" aria-label={t(lang, 'mainNav')}>
          <ul id="site-nav-menu" className={menuOpen ? 'nav__menu is-open' : 'nav__menu'}>
            {menu.map((item) => (hasSubmenu(item) ? (
              <Submenu
                key={item.label}
                item={item}
                open={openItem === item.label}
                onToggle={() => setOpenItem((cur) => (cur === item.label ? null : item.label))}
              />
            ) : (
              <li className="nav__item" key={item.label}>
                <a className="nav__top" href={item.href || '#'} onClick={() => menuClick(item.label)}>{item.label}</a>
              </li>
            )))}
            {languages.length > 0 && (
              <li className="nav__lang">
                <select aria-label={t(lang, 'language')} value={lang} onChange={changeLang}>
                  {languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
