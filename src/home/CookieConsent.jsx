// KAN-13 (FR-13.1, FR-13.4): banner đồng ý cookie lần đầu vào trang — hai nút "Accept" và "Reject" cùng kích thước.
// Lựa chọn lưu ở localStorage (tracking.js); đã Accept (lần này hoặc lần trước) thì nạp GTM nếu có VITE_GTM_ID.
import React, { useEffect, useState } from 'react';
import { CONSENT_ACCEPTED, CONSENT_REJECTED, loadGtm, readConsent, saveConsent } from './tracking.js';
import { t } from '../i18n.js';

export function bannerVisible(consent) {
  return consent === null;
}

export default function CookieConsent({ lang }) {
  const [consent, setConsent] = useState(() => readConsent());

  useEffect(() => {
    if (consent === CONSENT_ACCEPTED) loadGtm();
  }, [consent]);

  if (!bannerVisible(consent)) return null;

  const choose = (value) => {
    saveConsent(value);
    setConsent(value);
  };

  return (
    <section className="cookie-consent" aria-label={t(lang, 'cookieRegion')}>
      <p className="cookie-consent__text">{t(lang, 'cookieMessage')}</p>
      <div className="cookie-consent__actions">
        <button type="button" className="cookie-consent__btn cookie-consent__accept" onClick={() => choose(CONSENT_ACCEPTED)}>
          {t(lang, 'cookieAccept')}
        </button>
        <button type="button" className="cookie-consent__btn cookie-consent__reject" onClick={() => choose(CONSENT_REJECTED)}>
          {t(lang, 'cookieReject')}
        </button>
      </div>
    </section>
  );
}
