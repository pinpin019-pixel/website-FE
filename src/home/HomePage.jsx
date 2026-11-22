// Trang chủ: dựng các khối nội dung từ GET /api/home theo ngôn ngữ hiện tại
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getHome } from '../api.js';
import { readStoredLang, resolveLang, storeLang, t } from '../i18n.js';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import Hero from './Hero.jsx';
import ClientStrip from './ClientStrip.jsx';
import Solutions from './Solutions.jsx';
import WhyUs from './WhyUs.jsx';
import CaseStudies from './CaseStudies.jsx';
import Media from './Media.jsx';
import { Awards, Certificates, Partners } from './LogoCarousels.jsx';
import Testimonials from './Testimonials.jsx';
import './home.css';

// key khối → component; story của từng khối thêm dòng của mình. Khối chưa có component thì bỏ qua.
export const BLOCK_COMPONENTS = {
  header: Header,
  hero: Hero,
  clients: ClientStrip,
  solutions: Solutions,
  why: WhyUs,
  case_studies: CaseStudies,
  awards: Awards,
  certificates: Certificates,
  partners: Partners,
  media: Media,
  testimonials: Testimonials,
  footer: Footer,
};

export function renderableBlocks(blocks, components = BLOCK_COMPONENTS) {
  return (blocks || []).filter((b) => components[b.key]);
}

export function seoOf(blocks) {
  return (blocks || []).find((b) => b.key === 'seo')?.content ?? null;
}

function setMetaDescription(text) {
  let el = document.querySelector('meta[name="description"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', 'description');
    document.head.appendChild(el);
  }
  el.setAttribute('content', text);
}

export default function HomePage() {
  const [params] = useSearchParams();
  const query = params.get('lang');
  const lang = resolveLang(query, readStoredLang());
  const [state, setState] = useState({ status: 'loading', blocks: [] });

  useEffect(() => {
    if (query) storeLang(lang);
    document.documentElement.lang = lang;
  }, [query, lang]);

  useEffect(() => {
    let alive = true;
    // Đổi ngôn ngữ: giữ khối cũ trên màn hình tới khi có dữ liệu mới (header không biến mất)
    setState((s) => ({ status: 'loading', blocks: s.blocks }));
    getHome(lang)
      .then((data) => { if (alive) setState({ status: 'ok', blocks: data.blocks || [] }); })
      .catch(() => { if (alive) setState({ status: 'error', blocks: [] }); });
    return () => { alive = false; };
  }, [lang]);

  useEffect(() => {
    const seo = seoOf(state.blocks);
    if (!seo) return;
    if (seo.title) document.title = seo.title;
    if (seo.description) setMetaDescription(seo.description);
  }, [state.blocks]);

  return (
    <div className="home">
      {state.status === 'loading' && state.blocks.length === 0 && <p className="home__status" aria-busy="true">{t(lang, 'loading')}</p>}
      {state.status === 'error' && <p className="home__error" role="alert">{t(lang, 'homeLoadError')}</p>}
      {renderableBlocks(state.blocks).map((b) => {
        const Block = BLOCK_COMPONENTS[b.key];
        return <Block key={b.key} content={b.content} lang={lang} />;
      })}
    </div>
  );
}
