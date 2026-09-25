document.documentElement.classList.add('js');

// ---------- Reveal on scroll ----------
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ---------- Top bar: highlight the section you are reading ----------
const navLinks = [...document.querySelectorAll('.topbar-nav a')];
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean).forEach(t => navObserver.observe(t));

// ---------- IA map: open one section of the sidebar at a time ----------
const iaItems = [...document.querySelectorAll('.ia-map > ol > li')];
iaItems.forEach(item => {
  const head = item.querySelector('span');
  head.setAttribute('role', 'button');
  head.tabIndex = 0;
  const open = () => iaItems.forEach(i => i.classList.toggle('is-open', i === item));
  head.addEventListener('click', open);
  head.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
});

// ---------- Screens: tabs with a one-line caption from the case study ----------
const captions = {
  ar: [
    'نظرة سريعة على المؤشرات وآخر المهام.',
    'تنظيم ومتابعة حالات المعاملات.',
    'الوصول إلى أقسام المتابعة المختلفة.',
    'تجميع النتائج وعرض البيانات المكتملة.',
  ],
  en: [
    'Quick overview of indicators and recent tasks.',
    'Organized tracking of administrative transactions and statuses.',
    'Access to different monitoring areas.',
    'Consolidated results and completed records.',
  ],
};
const captionFor = i => captions[document.documentElement.lang === 'en' ? 'en' : 'ar'][i];
document.querySelectorAll('[data-tabs]').forEach(group => {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  const panels = [...group.querySelectorAll('[role="tabpanel"]')];
  const caption = group.querySelector('.tab-caption');
  tabs.forEach((tab, i) => tab.addEventListener('click', () => {
    tabs.forEach((t, j) => t.setAttribute('aria-selected', i === j ? 'true' : 'false'));
    panels.forEach((p, j) => { p.hidden = i !== j; });
    if (caption) caption.textContent = captionFor(i);
  }));
  // keep the caption of the open tab in the chosen language
  document.addEventListener('langchange', () => {
    const open = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    if (caption && open >= 0) caption.textContent = captionFor(open);
  });
});
// the page may already be in English before this script ran
if (document.documentElement.lang === 'en') document.dispatchEvent(new CustomEvent('langchange'));
