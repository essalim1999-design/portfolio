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
const navTargets = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
navTargets.forEach(t => navObserver.observe(t));

// ---------- Design process: the highlighted step walks along the line ----------
const steps = [...document.querySelectorAll('.process li')];
if (steps.length) {
  new IntersectionObserver(([entry], obs) => {
    if (!entry.isIntersecting) return;
    obs.disconnect();
    steps.forEach((step, i) => setTimeout(() => {
      steps.forEach(s => s.classList.remove('is-on'));
      step.classList.add('is-on');
    }, 350 + i * 450));
  }, { threshold: 0.6 }).observe(steps[0].parentElement);
}

// ---------- Mobile screens: light / dark switch ----------
const modeButtons = [...document.querySelectorAll('.mode-switch button')];
const modeRow = document.querySelector('.phones-row[data-mode]');
modeButtons.forEach(btn => btn.addEventListener('click', () => {
  modeRow.dataset.mode = btn.dataset.mode;
  modeButtons.forEach(b => {
    b.classList.toggle('is-active', b === btn);
    b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
  });
}));

// ---------- Tabs (web pages, dashboard) ----------
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

// ---------- Click a screen to see it full size ----------
const viewer = document.querySelector('.viewer');
if (viewer?.showModal) {
  const big = viewer.querySelector('img');
  document.querySelectorAll('.sketches img, .wire img, .phones-row img, .gallery img, .dash-phone img, .browser img').forEach(img => {
    img.addEventListener('click', () => {
      big.src = img.src;
      big.alt = img.alt;
      viewer.showModal();
    });
  });
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', e => { if (e.target === viewer) viewer.close(); });
}
