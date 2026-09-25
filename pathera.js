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

// ---------- Tabs: Arabic / English landing page ----------
document.querySelectorAll('[data-tabs]').forEach(group => {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  const panels = [...group.querySelectorAll('[role="tabpanel"]')];
  const scroller = group.querySelector('.browser-scroll');
  tabs.forEach((tab, i) => tab.addEventListener('click', () => {
    tabs.forEach((t, j) => t.setAttribute('aria-selected', i === j ? 'true' : 'false'));
    panels.forEach((p, j) => { p.hidden = i !== j; });
    if (scroller) scroller.scrollTop = 0;
  }));
});
