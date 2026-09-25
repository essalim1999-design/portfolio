document.documentElement.classList.add('js');

const WHATSAPP_NUMBER = '966545916805';

// ---------- Corner handles for every “selection box” ----------
document.querySelectorAll('.sel').forEach(box => {
  ['tl', 'tr', 'bl', 'br'].forEach(pos => {
    const h = document.createElement('i');
    h.className = `hd ${pos}`;
    h.setAttribute('aria-hidden', 'true');
    box.appendChild(h);
  });
});

// ---------- Marquee tapes: repeat text so the loop is seamless ----------
// each half must be wider than the tape itself, or the text runs out before the loop restarts
function fillTapes() {
  document.querySelectorAll('.tape-track').forEach(track => {
    const text = track.dataset.text;
    track.innerHTML = `<span>${text}</span>`;
    const one = track.firstElementChild.getBoundingClientRect().width || 100;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const count = Math.ceil(track.parentElement.offsetWidth / (one + gap)) + 1;
    const half = Array.from({ length: count }, () => `<span>${text}</span>`).join('');
    track.innerHTML = half + half;
  });
}
fillTapes();
document.fonts?.ready.then(fillTapes);
let tapeWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (Math.abs(window.innerWidth - tapeWidth) < 50) return;
  tapeWidth = window.innerWidth;
  fillTapes();
});

// ---------- Dock: active section + compact on scroll ----------
const dock = document.querySelector('.dock');
const dockLinks = [...document.querySelectorAll('.dock-link')];
const sections = dockLinks
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

function setActive(id) {
  dockLinks.forEach(link => {
    const on = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('is-active', on);
    if (on) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

function onScroll() {
  const probe = window.innerHeight * 0.35;
  let current = sections[0].id;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= probe) current = section.id;
  }
  // bottom of page → last section
  if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
    current = sections[sections.length - 1].id;
  }
  setActive(current);
  if (dock) dock.classList.toggle('is-compact', window.scrollY > 80);
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });
onScroll();

// ---------- Language switch: Arabic (default) ⇄ English ----------
// Every translatable element carries its English text in data-en / data-en-placeholder /
// data-en-alt / data-en-label; the Arabic original is kept the first time we switch.
const PAGE_META = {
  ar: { title: document.title, desc: document.querySelector('meta[name="description"]')?.content },
  en: { title: 'Esraa Salem | UI/UX Designer & Front-End Developer', desc: 'Esraa Salem — UI/UX designer and front-end developer.' },
};
let lang = 'ar';
const t = (ar, en) => (lang === 'en' ? en : ar);

function swap(el, key, read, write) {
  const store = `ar${key}`;
  if (el.dataset[store] === undefined) el.dataset[store] = read(el);
  write(el, lang === 'en' ? el.dataset[`en${key}`] : el.dataset[store]);
}

function applyLang(next) {
  lang = next;
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'en' ? 'ltr' : 'rtl';
  document.title = PAGE_META[lang].title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', PAGE_META[lang].desc);

  document.querySelectorAll('[data-en]').forEach(el => swap(el, '', e => e.innerHTML, (e, v) => { e.innerHTML = v; }));
  document.querySelectorAll('[data-en-placeholder]').forEach(el => swap(el, 'Placeholder', e => e.placeholder, (e, v) => { e.placeholder = v; }));
  document.querySelectorAll('[data-en-alt]').forEach(el => swap(el, 'Alt', e => e.alt, (e, v) => { e.alt = v; }));
  document.querySelectorAll('[data-en-label]').forEach(el => swap(el, 'Label', e => e.getAttribute('aria-label'), (e, v) => {
    e.setAttribute('aria-label', v);
    if (e.dataset.label !== undefined) e.dataset.label = v; // dock tooltips
  }));
  // marquee tapes are rebuilt from their text
  document.querySelectorAll('[data-en-text]').forEach(el => swap(el, 'Text', e => e.dataset.text, (e, v) => { e.dataset.text = v; }));
  fillTapes();
  // project dots are named after their cards
  document.querySelectorAll('.cards-dots button').forEach((dot, i) => {
    const card = document.querySelectorAll('.cards .card')[i];
    const name = card?.querySelector('.card-title img')?.alt || card?.querySelector('.card-title')?.textContent.trim();
    if (name) dot.setAttribute('aria-label', name);
  });

  const langToggle = document.querySelector('.lang-toggle');
  if (langToggle) {
    const label = lang === 'en' ? 'العربية' : 'English';
    langToggle.setAttribute('aria-pressed', String(lang === 'en'));
    langToggle.setAttribute('aria-label', label);
    langToggle.dataset.label = label;
  }
  // messages from the other language would be stale
  document.querySelectorAll('.field-error').forEach(e => { e.textContent = ''; });
  document.querySelectorAll('.field.has-error').forEach(f => f.classList.remove('has-error'));
  try { localStorage.setItem('es-lang', lang); } catch {}
  window.dispatchEvent(new Event('resize')); // tapes & carousel re-measure
}

document.querySelector('.lang-toggle')?.addEventListener('click', () => applyLang(lang === 'en' ? 'ar' : 'en'));
let savedLang = null;
try { savedLang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('es-lang'); } catch {}

// ---------- Reveal on scroll ----------
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ---------- Section titles: Figma-like select animation when they come into view ----------
const stampObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    stampObserver.unobserve(entry.target);
  });
}, { threshold: 0.6 });
document.querySelectorAll('.stamp').forEach(el => stampObserver.observe(el));

// hero plays the same entrance right away (at full speed)
requestAnimationFrame(() => document.querySelector('.art-hero')?.classList.add('is-in'));

// ---------- About: words come out of a blur, then “وضوح” lights up ----------
// Order inside the section: text appears → tags fall → the bulb lights up.
const aboutBody = document.querySelector('.about-body');
let aboutStartedAt = 0;          // when the text started appearing (0 = not yet)
if (aboutBody) {
  let lastWordAt = 0;
  document.querySelectorAll('.about-col').forEach((col, colIndex) => {
    let i = 0;
    const base = 200 + colIndex * 300;          // Arabic first, English right after
    const wrapWords = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.style.setProperty('--i', i++);
            w.textContent = part;
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR' && !child.classList.contains('seal')) {
          wrapWords(child);
        }
      });
    };
    col.querySelectorAll('.type-in').forEach(el => {
      wrapWords(el);
      el.style.setProperty('--base', `${base}ms`);
    });
    lastWordAt = Math.max(lastWordAt, base + i * 55);
  });

  new IntersectionObserver(([entry], obs) => {
    if (!entry.isIntersecting) return;
    aboutBody.classList.add('is-in');
    aboutStartedAt = performance.now();
    const litAt = Math.max(lastWordAt + 500, 3600);
    setTimeout(() => aboutBody.classList.add('is-lit'), litAt);
    setTimeout(() => aboutBody.classList.add('is-stamped'), litAt + 1000);   // “معتمد” seal
    obs.disconnect();
  }, { threshold: 0.3 }).observe(aboutBody);
}

// ---------- About: tags fall from above when they come into view ----------
const chips = document.querySelector('.chips');
if (chips) {
  const rand = (min, max) => min + Math.random() * (max - min);
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const items = [...chips.children];

  // every tag falls its own way: random order, loose timing (small clusters),
  // different height, speed, spin, sideways drift and bounce
  let landsAt = 0;
  items.map((_, i) => i).sort(() => Math.random() - 0.5).forEach((itemIndex, step) => {
    const chip = items[itemIndex];
    const delay = 150 + step * rand(70, 230) + rand(0, 120);
    const dur = rand(1150, 1900);
    landsAt = Math.max(landsAt, delay + dur);
    chip.style.setProperty('--delay', `${delay.toFixed(0)}ms`);
    chip.style.setProperty('--dur', `${dur.toFixed(0)}ms`);
    chip.style.setProperty('--spin', `${rand(-50, 50).toFixed(1)}deg`);
    chip.style.setProperty('--drift', `${rand(-140, 140).toFixed(0)}px`);
    chip.style.setProperty('--fall', `${-rand(45, 95).toFixed(0)}vh`);
    chip.style.setProperty('--bounce', `${rand(14, 52).toFixed(0)}px`);
    chip.style.setProperty('--skid', `${rand(-18, 18).toFixed(0)}px`);
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const drop = () => {
    chips.classList.add('is-dropped');
    setTimeout(() => chips.classList.add('is-landed'), reduceMotion ? 0 : landsAt + 80);
  };

  if (reduceMotion || !('IntersectionObserver' in window)) {
    drop();
  } else {
    // tags start falling ~1s after the text begins, so the visitor reads first
    const TEXT_HEAD_START = 1000;
    const dropObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      dropObserver.disconnect();
      const tryDrop = () => {
        if (!aboutStartedAt) { setTimeout(tryDrop, 100); return; }
        setTimeout(drop, Math.max(0, aboutStartedAt + TEXT_HEAD_START - performance.now()));
      };
      tryDrop();
    }, { threshold: 0.6 });
    dropObserver.observe(chips);
  }

  // ---------- Drag & throw with a little physics ----------
  const GRAVITY = 0.9, BOUNCE = 0.45, WALL_BOUNCE = 0.6, FLOOR_FRICTION = 0.82;
  let zTop = 1;                                  // last touched tag stays on top

  items.forEach(chip => {
    const s = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, raf: 0, last: 0, samples: [], minX: 0, maxX: 0, minY: 0, offX: 0, offY: 0, grabbed: false };

    const apply = () => {
      chip.style.translate = `${s.x}px ${s.y}px`;
      chip.style.rotate = `${s.rot}deg`;
    };

    const measureBounds = () => {
      const box = chips.getBoundingClientRect();
      const r = chip.getBoundingClientRect();
      s.minX = box.left - (r.left - s.x);
      s.maxX = box.right - (r.right - s.x);
      s.minY = box.top - (r.top - s.y) - 320;      // can be tossed a bit above the row
    };

    const step = now => {
      const dt = s.last ? clamp((now - s.last) / 16.67, 0.5, 2) : 1;
      s.last = now;
      s.vy += GRAVITY * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      if (s.x < s.minX) { s.x = s.minX; s.vx = -s.vx * WALL_BOUNCE; }
      if (s.x > s.maxX) { s.x = s.maxX; s.vx = -s.vx * WALL_BOUNCE; }
      if (s.y < s.minY) { s.y = s.minY; s.vy = 0; }

      const onFloor = s.y >= 0;
      if (onFloor) {
        s.y = 0;
        s.vy = Math.abs(s.vy) > 2.5 ? -s.vy * BOUNCE : 0;
        s.vx *= FLOOR_FRICTION;
        s.rot += (0 - s.rot) * 0.25;
      } else {
        s.rot += (clamp(s.vx * 1.4, -28, 28) - s.rot) * 0.15;
      }
      apply();

      if (onFloor && s.vy === 0 && Math.abs(s.vx) < 0.15 && Math.abs(s.rot) < 0.3) {
        s.vx = 0; s.rot = 0; s.last = 0;
        apply();
        return;
      }
      s.raf = requestAnimationFrame(step);
    };

    chip.addEventListener('pointerdown', e => {
      if (!chips.classList.contains('is-landed') || e.button > 0) return;
      e.preventDefault();
      cancelAnimationFrame(s.raf);
      s.last = 0;
      measureBounds();
      chip.setPointerCapture(e.pointerId);
      chip.style.zIndex = ++zTop;
      chip.classList.add('is-grabbed');
      s.grabbed = true;
      s.offX = e.clientX - s.x;
      s.offY = e.clientY - s.y;
      s.samples = [{ t: performance.now(), x: s.x, y: s.y }];
    });

    chip.addEventListener('pointermove', e => {
      if (!s.grabbed) return;
      const prevX = s.x;
      s.x = clamp(e.clientX - s.offX, s.minX, s.maxX);
      s.y = clamp(e.clientY - s.offY, s.minY, 0);
      s.rot = clamp((s.x - prevX) * 1.5, -25, 25);
      s.samples.push({ t: performance.now(), x: s.x, y: s.y });
      if (s.samples.length > 6) s.samples.shift();
      apply();
    });

    const release = () => {
      if (!s.grabbed) return;
      s.grabbed = false;
      chip.classList.remove('is-grabbed');
      const now = performance.now();
      const recent = s.samples.filter(p => now - p.t < 100);
      const a = recent[0], b = recent[recent.length - 1];
      if (a && b && b.t > a.t) {
        s.vx = clamp(((b.x - a.x) / (b.t - a.t)) * 16.67, -45, 45);
        s.vy = clamp(((b.y - a.y) / (b.t - a.t)) * 16.67, -45, 45);
      } else {
        s.vx = 0; s.vy = 0;
      }
      s.raf = requestAnimationFrame(step);
    };
    chip.addEventListener('pointerup', release);
    chip.addEventListener('pointercancel', release);
  });
}

// ---------- Skills: boxes get selected one by one + soft light over the dot grid ----------
const skillsGrid = document.querySelector('.skills-grid');
if (skillsGrid) {
  new IntersectionObserver(([entry], obs) => {
    if (!entry.isIntersecting) return;
    skillsGrid.classList.add('is-in');
    obs.disconnect();
  }, { threshold: 0.3 }).observe(skillsGrid);
}

// ---------- Skills: dots near the mouse / finger grow and turn yellow ----------
const skills = document.querySelector('.skills');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (skills && !reduceMotion) {
  const canvas = document.createElement('canvas');
  canvas.className = 'dots-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  skills.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const GAP = 24, RADIUS = 190;
  const tint = [255, 210, 47]; // --yellow
  let w = 0, h = 0, dpr = 1;
  let target = null, pos = null, power = 0, raf = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = skills.clientWidth; h = skills.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const want = target ? 1 : 0;
    power += (want - power) * 0.12;
    if (target) pos = pos ? { x: pos.x + (target.x - pos.x) * 0.25, y: pos.y + (target.y - pos.y) * 0.25 } : { ...target };
    ctx.clearRect(0, 0, w, h);
    if (pos && power > 0.01) {
      // dots sit where the CSS grid draws them: centred, every 24px
      const x0 = w / 2 + Math.ceil((pos.x - RADIUS - w / 2) / GAP) * GAP;
      const y0 = h / 2 + Math.ceil((pos.y - RADIUS - h / 2) / GAP) * GAP;
      for (let x = x0; x <= pos.x + RADIUS; x += GAP) {
        for (let y = y0; y <= pos.y + RADIUS; y += GAP) {
          const d = Math.hypot(x - pos.x, y - pos.y);
          if (d > RADIUS) continue;
          const t = (1 - d / RADIUS) ** 2 * power;           // 0 at the edge → 1 under the pointer
          const mix = Math.min(1, t * 1.6);
          const c = tint.map(v => Math.round(255 + (v - 255) * mix));
          ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${0.15 + t * 0.85})`;
          ctx.beginPath();
          ctx.arc(x, y, 1 + t * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    raf = (target || power > 0.01) ? requestAnimationFrame(draw) : 0;
  }
  const wake = () => { if (!raf) raf = requestAnimationFrame(draw); };

  function point(clientX, clientY) {
    const r = skills.getBoundingClientRect();
    target = { x: clientX - r.left, y: clientY - r.top };
    wake();
  }
  skills.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') point(e.clientX, e.clientY); });
  skills.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { target = null; wake(); } });
  // touch: follow the finger while it scrolls through the section
  skills.addEventListener('touchstart', e => point(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  skills.addEventListener('touchmove', e => point(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  skills.addEventListener('touchend', () => { target = null; wake(); }, { passive: true });

  resize();
  new ResizeObserver(resize).observe(skills);
}

// ---------- Figma multiplayer cursor ----------
const figCursor = document.querySelector('.fig-cursor');
if (figCursor && !reduceMotion) {
  const label = figCursor.querySelector('.fig-cursor-label');
  const rootStyle = getComputedStyle(document.documentElement);
  const colour = name => rootStyle.getPropertyValue(`--${name}`).trim();
  // section → [cursor colour, label text colour]
  const THEMES = {
    home: ['blue', '#fff'], about: ['pink', '#fff'], skills: ['yellow', '#242424'],
    projects: ['purple', '#fff'], contact: ['green', '#242424'], footer: ['blue', '#fff'],
  };
  let theme = '';
  let hideTimer = 0;

  function place(x, y) { figCursor.style.transform = `translate(${x}px, ${y}px)`; }

  function update(target) {
    const zone = target.closest('section[id], footer');
    const key = zone ? (zone.id || 'footer') : 'home';
    if (key !== theme && THEMES[key]) {
      theme = key;
      figCursor.style.setProperty('--fc', colour(THEMES[key][0]));
      figCursor.style.setProperty('--fc-ink', THEMES[key][1]);
    }
    let text = 'You';
    if (target.closest('.card:not([data-pos="0"])')) text = 'View';
    else if (target.closest('a, button, label, .opt, .dot-btn, .cards-dots *')) text = 'Click';
    else if (target.closest('.cards')) text = 'Drag';
    if (label.textContent !== text) label.textContent = text;
  }

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    // mouse: the Figma cursor replaces the real pointer (text fields keep their caret)
    document.documentElement.classList.add('fig-cursor-on');
    document.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      place(e.clientX, e.clientY);
      const inField = e.target.closest('input, textarea, select');
      figCursor.classList.toggle('is-on', !inField);
      update(e.target);
    }, { passive: true });
    document.addEventListener('pointerdown', () => figCursor.classList.add('is-press'));
    document.addEventListener('pointerup', () => figCursor.classList.remove('is-press'));
    document.documentElement.addEventListener('mouseleave', () => figCursor.classList.remove('is-on'));
  } else {
    // touch: the cursor pops up next to the finger for a moment, then fades
    document.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      place(e.clientX + 14, e.clientY - 34);
      update(e.target);
      figCursor.classList.add('is-on');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => figCursor.classList.remove('is-on'), 900);
    }, { passive: true });
  }
}

// ---------- Selected work: tapes unroll when the section comes into view ----------
const tapes = document.querySelector('.tapes');
if (tapes) {
  new IntersectionObserver(([entry], obs) => {
    if (!entry.isIntersecting) return;
    tapes.classList.add('is-in');
    obs.disconnect();
  }, { threshold: 0.6 }).observe(tapes);
}

// ---------- Selected work: the 3 cards turn on a circle — drag, tap a side card or use the dots ----------
const cardsWrap = document.querySelector('.cards');
const dotsWrap = document.querySelector('.cards-dots');
if (cardsWrap) {
  const cards = [...cardsWrap.querySelectorAll('.card')];
  const n = cards.length;
  let active = cards.findIndex(c => c.classList.contains('is-featured'));
  if (active < 0) active = 0;

  const dots = cards.map((card, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    const name = card.querySelector('.card-title img')?.alt || card.querySelector('.card-title')?.textContent.trim() || `${i + 1}`;
    dot.setAttribute('aria-label', name);
    dot.addEventListener('click', () => show(i));
    dotsWrap?.appendChild(dot);
    return dot;
  });

  // pos: 0 = front, -1 = right side, 1 = left side (page is RTL)
  function show(index) {
    active = (index + n) % n;
    cards.forEach((card, i) => {
      card.dataset.pos = ((i - active + n + 1) % n) - 1;
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', i === active ? 'true' : 'false'));
  }
  show(active);

  // drag: to the left brings the right card to the front, and vice versa
  let startX = 0, startY = 0, tracking = false;
  cardsWrap.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    startX = e.clientX; startY = e.clientY; tracking = true;
    cardsWrap.classList.add('is-dragging');
  });
  window.addEventListener('pointerup', e => {
    if (!tracking) return;
    tracking = false;
    cardsWrap.classList.remove('is-dragging');
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    show(dx < 0 ? active - 1 : active + 1);
    cardsWrap.dataset.swiped = '1';                 // the click that follows a drag is not a tap
    setTimeout(() => delete cardsWrap.dataset.swiped, 60);
  });
  window.addEventListener('pointercancel', () => { tracking = false; cardsWrap.classList.remove('is-dragging'); });

  // tapping a side card brings it to the front
  cards.forEach((card, i) => {
    card.addEventListener('click', e => {
      if (cardsWrap.dataset.swiped) { delete cardsWrap.dataset.swiped; e.preventDefault(); return; }
      if (card.dataset.pos === '0') return;
      e.preventDefault();
      show(i);
    });
  });
}

// ---------- VIEW CASE STUDY: the arrow (and a little of the button) follows the mouse ----------
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.btn-case').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);   // -1 … 1
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      btn.style.setProperty('--bx', `${(dx * 4).toFixed(1)}px`);
      btn.style.setProperty('--by', `${(dy * 3).toFixed(1)}px`);
      btn.style.setProperty('--ix', `${(dx * 5).toFixed(1)}px`);
      btn.style.setProperty('--iy', `${(dy * 5).toFixed(1)}px`);
    });
    btn.addEventListener('pointerleave', () => {
      ['--bx', '--by', '--ix', '--iy'].forEach(v => btn.style.removeProperty(v));
    });
  });
}

// ---------- Contact form → WhatsApp ----------
const form = document.getElementById('contact-form');
const nameInput = document.getElementById('f-name');
const phoneInput = document.getElementById('f-phone');
const codeSelect = document.getElementById('f-code');
const details = document.getElementById('f-details');
const counter = document.getElementById('counter');
const sendBtn = form.querySelector('.btn-send');

const toLatinDigits = s => s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
                            .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

function setError(fieldId, message) {
  const error = form.querySelector(`.field-error[data-for="${fieldId}"]`);
  const input = document.getElementById(fieldId);
  if (error) error.textContent = message || '';
  if (input) {
    input.closest('.field')?.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
}

function normalizedPhone() {
  let digits = toLatinDigits(phoneInput.value).replace(/\D/g, '');
  digits = digits.replace(/^0+/, ''); // 05xxxxxxxx → 5xxxxxxxx
  return digits;
}

function validatePhone() {
  const opt = codeSelect.selectedOptions[0];
  const len = Number(opt.dataset.len);
  const start = opt.dataset.start;
  const digits = normalizedPhone();
  if (!digits) return t('اكتب رقم جوالك عشان أقدر أتواصل معك', 'Add your mobile number so I can reach you');
  if (digits.length !== len || (start && !digits.startsWith(start))) {
    return t(
      `الرقم غير صحيح — يجب أن يكون ${len} أرقام${start ? ` ويبدأ بـ ${start}` : ''}`,
      `Invalid number — it should be ${len} digits${start ? ` starting with ${start}` : ''}`
    );
  }
  return '';
}

function validateName() {
  return nameInput.value.trim().length < 2 ? t('اكتب اسمك', 'Please write your name') : '';
}

phoneInput.addEventListener('input', () => {
  const clean = toLatinDigits(phoneInput.value).replace(/[^\d]/g, '');
  if (clean !== phoneInput.value) phoneInput.value = clean;
  if (phoneInput.closest('.field').classList.contains('has-error')) setError('f-phone', validatePhone());
});
phoneInput.addEventListener('blur', () => phoneInput.value && setError('f-phone', validatePhone()));
codeSelect.addEventListener('change', () => phoneInput.value && setError('f-phone', validatePhone()));
nameInput.addEventListener('input', () => {
  if (nameInput.closest('.field').classList.contains('has-error')) setError('f-name', validateName());
});

// "أخرى" opens a field to write the service in
const otherToggle = document.getElementById('f-other-toggle');
const otherField = form.querySelector('.other-field');
const otherInput = document.getElementById('f-other');
otherToggle?.addEventListener('change', () => {
  otherField.hidden = !otherToggle.checked;
  if (otherToggle.checked) otherInput.focus();
});

details.addEventListener('input', () => {
  const n = details.value.length;
  counter.textContent = `${n}/2000`;
  counter.classList.toggle('is-near', n > 1800);
});

form.addEventListener('submit', event => {
  event.preventDefault();

  const nameErr = validateName();
  const phoneErr = validatePhone();
  setError('f-name', nameErr);
  setError('f-phone', phoneErr);
  if (nameErr || phoneErr) {
    (nameErr ? nameInput : phoneInput).focus();
    return;
  }

  const data = new FormData(form);
  const other = (data.get('other') || '').trim();
  // the message uses the option texts as shown, so it follows the page language
  const shown = input => input.closest('label').querySelector('span').textContent.trim();
  const services = [...form.querySelectorAll('input[name="services"]:checked')].map(input => {
    const text = shown(input);
    return input.id === 'f-other-toggle' && other ? `${text}: ${other}` : text;
  });
  const hasSite = form.querySelector('input[name="has_site"]:checked');
  const lines = [
    t('مرحباً إسراء 👋 عندي مشروع وأحب نتكلم عنه', 'Hi Esraa 👋 I have a project and would love to talk about it'),
    '',
    `• ${t('الاسم', 'Name')}: ${data.get('name').trim()}`,
    `• ${t('الجوال', 'Mobile')}: +${codeSelect.value}${normalizedPhone()}`,
  ];
  if (data.get('niche').trim()) lines.push(`• ${t('المجال', 'Field')}: ${data.get('niche').trim()}`);
  if (hasSite) lines.push(`• ${t('لديه موقع/متجر', 'Has a website/store')}: ${shown(hasSite)}`);
  if (services.length) lines.push(`• ${t('الخدمات', 'Services')}: ${services.join(t('، ', ', '))}`);
  if (data.get('details').trim()) lines.push('', `📝 ${t('التفاصيل', 'Details')}:`, data.get('details').trim());

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  window.open(url, '_blank', 'noopener');

  sendBtn.classList.add('is-sent');
  const sendLabel = sendBtn.querySelector('span');
  const idle = sendLabel.innerHTML;
  sendLabel.textContent = t('تم فتح واتساب ✓', 'WhatsApp opened ✓');
  setTimeout(() => {
    sendBtn.classList.remove('is-sent');
    sendLabel.innerHTML = idle;
  }, 3500);
});

// ---------- Footer year ----------
// ---------- Footer: the name signs itself when it comes into view ----------
const footerBrand = document.querySelector('.footer-brand');
if (footerBrand) {
  new IntersectionObserver(([entry], obs) => {
    if (!entry.isIntersecting) return;
    footerBrand.classList.add('is-signed');
    obs.disconnect();
  }, { threshold: 0.8 }).observe(footerBrand);
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- Start in the saved language (Arabic by default) ----------
if (savedLang === 'en') applyLang('en');
