/* =========================================================
   Case-study pages: Arabic (default) ⇄ English
   Each page loads its dictionary first (i18n/<page>.en.js → window.CASE_EN):
   every Arabic text block maps to its English HTML. A block is the element
   that directly holds the Arabic text, so if the Arabic is edited later,
   only that block stays untranslated — nothing breaks.
   The choice is shared with the home page (localStorage "es-lang").
   ========================================================= */
(function () {
  const dict = window.CASE_EN;
  if (!dict) return;

  const AR = /[؀-ۿ]/;
  const ATTRS = ['alt', 'aria-label', 'title', 'placeholder', 'content'];
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const blocks = [];
  const attrs = [];

  // same walk that produced the dictionary
  (function walk(el) {
    if (['SCRIPT', 'STYLE', 'TEMPLATE'].includes(el.tagName)) return;
    for (const name of ATTRS) {
      const v = el.getAttribute(name);
      if (v && AR.test(v) && dict.attrs[norm(v)]) attrs.push({ el, name, ar: v, en: dict.attrs[norm(v)] });
    }
    const direct = [...el.childNodes].some(n => n.nodeType === 3 && AR.test(n.textContent));
    if (direct && el.tagName !== 'BODY' && el.tagName !== 'HEAD') {
      const en = dict.units[norm(el.innerHTML)];
      if (en) blocks.push({ el, ar: el.innerHTML, en });
      return;
    }
    for (const child of el.children) walk(child);
  })(document.documentElement);

  // language button in the top bar, green like Figma's Dev Mode (same as the home page)
  const style = document.createElement('style');
  style.textContent = `
    .case-lang { display: inline-grid; place-items: center; width: 38px; height: 38px; flex: none;
      border: 0; border-radius: 10px; cursor: pointer; color: #0d9f63; background: #e6f8f0;
      transition: background-color .25s, color .25s, box-shadow .25s; }
    .case-lang:hover { background: #d2f3e4; }
    .case-lang[aria-pressed="true"] { color: #fff; background: #14ae5c; box-shadow: 0 6px 16px rgba(20, 174, 92, .35); }
    .case-lang svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
    /* arrows follow the reading direction */
    html[dir="ltr"] :is(.fa-arrow-right, .fa-arrow-left) { scale: -1 1; }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'case-lang';
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>';
  const back = document.querySelector('.topbar .back');
  if (back) back.before(btn);

  function apply(lang) {
    const en = lang === 'en';
    document.documentElement.lang = en ? 'en' : 'ar';
    document.documentElement.dir = en ? 'ltr' : 'rtl';
    blocks.forEach(b => { b.el.innerHTML = en ? b.en : b.ar; });
    attrs.forEach(a => a.el.setAttribute(a.name, en ? a.en : a.ar));
    // links to a page that has an English version
    document.querySelectorAll('a[data-en-href]').forEach(a => {
      if (!a.dataset.arHref) a.dataset.arHref = a.getAttribute('href');
      a.setAttribute('href', en ? a.dataset.enHref : a.dataset.arHref);
    });
    // screenshots that exist in both languages
    document.querySelectorAll('img[data-en-src]').forEach(img => {
      if (!img.dataset.arSrc) img.dataset.arSrc = img.getAttribute('src');
      img.setAttribute('src', en ? img.dataset.enSrc : img.dataset.arSrc);
      img.closest('.browser-scroll, .phone-scroll')?.scrollTo(0, 0);
    });
    btn.setAttribute('aria-pressed', String(en));
    btn.setAttribute('aria-label', en ? 'العربية' : 'English');
    btn.title = en ? 'العربية' : 'English';
    try { localStorage.setItem('es-lang', lang); } catch {}
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  btn.addEventListener('click', () => apply(document.documentElement.lang === 'en' ? 'ar' : 'en'));

  let saved = null;
  try { saved = new URLSearchParams(location.search).get('lang') || localStorage.getItem('es-lang'); } catch {}
  apply(saved === 'en' ? 'en' : 'ar');
})();
