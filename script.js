'use strict';
document.documentElement.classList.add('js');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobile = window.matchMedia('(max-width: 800px)');
const navigation = document.querySelector('#primary-navigation');
const menuButton = document.querySelector('.nav-toggle');

// A complete navigation remains available when JavaScript is disabled.
function setMenu(open, restoreFocus = false) {
  if (!navigation || !menuButton) return;
  navigation.hidden = mobile.matches && !open;
  menuButton.setAttribute('aria-expanded', String(open && mobile.matches));
  menuButton.innerHTML = open && mobile.matches ? 'Закрыть <span aria-hidden="true">−</span>' : 'Меню <span aria-hidden="true">＋</span>';
  if (restoreFocus) menuButton.focus();
}
setMenu(false);
menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
mobile.addEventListener('change', () => setMenu(false));
navigation?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('click', event => { if (!event.target.closest('.nav')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
});

// Only opacity and transform animate; each observed element is released after appearing.
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  document.documentElement.classList.add('motion-ready');
}

const skills = [...document.querySelectorAll('.skill')];
const skillTitle = document.querySelector('#skill-title');
const skillNote = document.querySelector('#skill-note');
const skillNumber = document.querySelector('#skill-number');
let selectedSkill = skills[0];
function describeSkill(skill) {
  if (!skill) return;
  skillTitle.textContent = skill.dataset.title;
  skillNote.textContent = skill.dataset.note;
  skillNumber.textContent = String(skills.indexOf(skill) + 1).padStart(2, '0');
}
skills.forEach(skill => {
  skill.addEventListener('click', () => {
    selectedSkill = skill;
    skills.forEach(item => { item.classList.toggle('is-selected', item === skill); item.setAttribute('aria-pressed', String(item === skill)); });
    describeSkill(skill);
  });
  skill.addEventListener('mouseenter', () => describeSkill(skill));
  skill.addEventListener('focus', () => describeSkill(skill));
  skill.addEventListener('mouseleave', () => describeSkill(selectedSkill));
  skill.addEventListener('blur', () => describeSkill(selectedSkill));
});

const viewer = document.querySelector('#image-viewer');
const viewerImage = document.querySelector('#viewer-image');
const viewerCaption = document.querySelector('#viewer-caption');
const viewerCounter = document.querySelector('#viewer-counter');
const viewerOriginal = document.querySelector('#viewer-original');
const viewerPrev = document.querySelector('.viewer-prev');
const viewerNext = document.querySelector('.viewer-next');
let viewerItems = [];
let viewerIndex = 0;
let viewerOpener = null;
let syncGallery = null;
function displayViewer(index) {
  viewerIndex = (index + viewerItems.length) % viewerItems.length;
  const item = viewerItems[viewerIndex];
  const sourceImage = item.querySelector('img');
  const crop = item.querySelector('.art-frame').dataset.crop.split(',').map(Number);
  const [x, y, width, height] = crop;
  viewerImage.setAttribute('viewBox', `0 0 ${width} ${height}`);
  viewerImage.setAttribute('aria-label', sourceImage.alt);
  const vectorImage = document.querySelector('#viewer-source');
  vectorImage.setAttribute('href', item.href);
  vectorImage.setAttribute('x', -x);
  vectorImage.setAttribute('y', -y);
  vectorImage.setAttribute('width', sourceImage.getAttribute('width'));
  vectorImage.setAttribute('height', sourceImage.getAttribute('height'));
  const clip = document.querySelector('#viewer-crop-rect');
  clip.setAttribute('width', width);
  clip.setAttribute('height', height);
  clip.setAttribute('rx', Math.min(width, height) * 0.025);
  viewerCaption.textContent = item.dataset.caption;
  viewerCounter.textContent = `${String(viewerIndex + 1).padStart(2, '0')} / ${String(viewerItems.length).padStart(2, '0')}`;
  viewerOriginal.href = item.href;
  viewerPrev.disabled = viewerNext.disabled = viewerItems.length < 2;
  if (syncGallery) syncGallery(viewerIndex);
}
function openViewer(items, index, opener, onChange) {
  if (!viewer || typeof viewer.showModal !== 'function') return false;
  viewerItems = items;
  viewerOpener = opener;
  syncGallery = onChange;
  displayViewer(index);
  viewer.showModal();
  document.body.classList.add('viewer-open');
  return true;
}
viewerPrev?.addEventListener('click', () => displayViewer(viewerIndex - 1));
viewerNext?.addEventListener('click', () => displayViewer(viewerIndex + 1));
document.querySelector('.viewer-close')?.addEventListener('click', () => viewer.close());
viewer?.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
viewer?.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    displayViewer(viewerIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
viewer?.addEventListener('close', () => {
  document.body.classList.remove('viewer-open');
  const gallery = viewerOpener?.closest('[data-gallery]');
  const focusTarget = gallery?.querySelector('.gallery-slide.is-active') || viewerOpener;
  focusTarget?.focus({ preventScroll: true });
  document.querySelector('#viewer-source').removeAttribute('href');
  syncGallery = null;
});

// No autoplay: readers control the pace. Without JS, slides remain horizontally scrollable links.
document.querySelectorAll('[data-gallery]').forEach(gallery => {
  const slides = [...gallery.querySelectorAll('.gallery-slide')];
  const previous = gallery.querySelector('.gallery-prev');
  const next = gallery.querySelector('.gallery-next');
  const counter = gallery.querySelector('.gallery-counter');
  const caption = gallery.querySelector('.gallery-caption');
  let active = 0;
  let touchStart = null;
  let lastSwipe = 0;
  function show(index) {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === active);
      slide.setAttribute('aria-hidden', String(i !== active));
      slide.inert = i !== active;
      slide.tabIndex = i === active ? 0 : -1;
    });
    counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    caption.textContent = slides[active].dataset.caption;
    gallery.dataset.artTone = slides[active].dataset.tone || 'dark';
  }
  previous.disabled = next.disabled = slides.length < 2;
  gallery.classList.add('is-enhanced');
  show(0);
  previous.addEventListener('click', () => show(active - 1));
  next.addEventListener('click', () => show(active + 1));
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const focusWasOnSlide = event.target.classList.contains('gallery-slide');
      show(active + (event.key === 'ArrowRight' ? 1 : -1));
      if (focusWasOnSlide) slides[active].focus({ preventScroll: true });
    }
  });
  slides.forEach((slide, index) => slide.addEventListener('click', event => {
    if (Date.now() - lastSwipe < 400) { event.preventDefault(); return; }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (openViewer(slides, index, slide, show)) event.preventDefault();
  }));
  gallery.addEventListener('touchstart', event => {
    if (event.touches.length === 1) touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    else touchStart = null;
  }, { passive: true });
  gallery.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (slides.length > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      show(active + (dx < 0 ? 1 : -1)); lastSwipe = Date.now();
    }
    touchStart = null;
  }, { passive: true });
  gallery.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
});

// Transform-based cursor; at most one update per animation frame, no continuous render loop.
const cursor = document.querySelector('.cursor');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
let cursorFrame = 0;
let cursorX = 0;
let cursorY = 0;
window.addEventListener('pointermove', event => {
  if (!cursor || !finePointer.matches || reduceMotion.matches || mobile.matches) return;
  cursorX = event.clientX; cursorY = event.clientY;
  if (!cursorFrame) cursorFrame = requestAnimationFrame(() => {
    cursor.style.transform = `translate3d(${cursorX - 11}px, ${cursorY - 11}px, 0)`;
    cursor.style.opacity = '1'; cursorFrame = 0;
  });
}, { passive: true });
document.documentElement.addEventListener('pointerleave', () => { if (cursor) cursor.style.opacity = '0'; });
window.addEventListener('blur', () => { if (cursor) cursor.style.opacity = '0'; });

// Stop decorative motion while its section is off screen or the tab is inactive.
const orbit = document.querySelector('.skill-orbit');
if (orbit && 'IntersectionObserver' in window) {
  let orbitVisible = false;
  const updateOrbit = () => orbit.classList.toggle('orbit-paused', !orbitVisible || document.hidden);
  const orbitObserver = new IntersectionObserver(entries => {
    orbitVisible = entries[0].isIntersecting;
    updateOrbit();
  });
  orbitObserver.observe(orbit);
  document.addEventListener('visibilitychange', updateOrbit);
}

// Keep direct links to the original case anchors useful.
function openLinkedCase() {
  const target = document.getElementById(location.hash.slice(1));
  if (target?.tagName === 'DETAILS') target.open = true;
}
window.addEventListener('hashchange', openLinkedCase);
openLinkedCase();

// Fit each crop inside its stage without stretching or hiding any artwork.
document.querySelectorAll('[data-gallery]').forEach(gallery => {
  const stage = gallery.querySelector('.gallery-track');
  const fit = () => {
    const slide = gallery.querySelector('.gallery-slide');
    const padding = parseFloat(getComputedStyle(slide).paddingLeft) * 2;
    const maxWidth = Math.max(1, stage.clientWidth - padding);
    const maxHeight = Math.max(1, stage.clientHeight - padding);
    gallery.querySelectorAll('.art-frame').forEach(frame => {
      const [, , width, height] = frame.dataset.crop.split(',').map(Number);
      const scale = Math.min(maxWidth / width, maxHeight / height);
      frame.style.width = `${width * scale}px`;
      frame.style.height = `${height * scale}px`;
    });
  };
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);
  else window.addEventListener('resize', fit, { passive: true });
  fit();
});

// A light ribbon field: capped resolution and frame rate, no external graphics library.
(() => {
  const canvas = document.querySelector('#ambient-canvas');
  const context = canvas?.getContext('2d', { alpha: true });
  if (!context) return;
  let width = 1, height = 1, frame = 0, last = 0, time = 0;
  let pointerX = .6, pointerY = .4, smoothX = .6, smoothY = .4;
  const targetFps = () => mobile.matches ? 22 : 30;
  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, mobile.matches ? 1 : 1.4);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  };
  function draw() {
    context.clearRect(0, 0, width, height);
    smoothX += (pointerX - smoothX) * .025;
    smoothY += (pointerY - smoothY) * .025;
    const count = mobile.matches ? 16 : 30;
    const drift = Math.sin(time * .14) * .085;
    const light = context.createLinearGradient(width * .2, height, width, 0);
    light.addColorStop(0, 'rgba(125,111,168,0)');
    light.addColorStop(.32, 'rgba(155,151,188,.10)');
    light.addColorStop(.64, 'rgba(180,210,146,.24)');
    light.addColorStop(1, 'rgba(209,232,187,0)');
    context.strokeStyle = light;
    context.lineWidth = mobile.matches ? .65 : .8;
    for (let i = 0; i < count; i++) {
      const offset = i / (count - 1);
      const ripple = Math.sin(time * .21 + offset * 2.2) * .055;
      context.beginPath();
      context.moveTo(width * (.18 + offset * .018), height * 1.15);
      context.bezierCurveTo(
        width * (.12 + offset * .25 + drift), height * (.2 + ripple),
        width * (1.04 - offset * .35 + (smoothX - .5) * .055), height * (1.05 + ripple + (smoothY - .5) * .06),
        width * (1.08 + offset * .014), height * (-.3 + offset * .035)
      );
      context.stroke();
    }
  }
  const tick = timestamp => {
    frame = 0;
    if (document.hidden || reduceMotion.matches) return;
    if (timestamp - last >= 1000 / targetFps()) {
      time += Math.min((timestamp - last) / 1000, .1);
      last = timestamp;
      draw();
    }
    frame = requestAnimationFrame(tick);
  };
  const start = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!document.hidden && !reduceMotion.matches) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    } else draw();
  };
  window.addEventListener('pointermove', event => {
    if (!finePointer.matches || reduceMotion.matches) return;
    pointerX = event.clientX / width; pointerY = event.clientY / height;
  }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', start);
  reduceMotion.addEventListener('change', start);
  resize(); start();
})();

// Subtle portrait depth on precise pointers; still on touchscreens and reduced motion.
const portrait = document.querySelector('.hero-image');
let portraitFrame = 0;
portrait?.addEventListener('pointermove', event => {
  if (!finePointer.matches || reduceMotion.matches || mobile.matches || portraitFrame) return;
  const x = event.clientX, y = event.clientY;
  portraitFrame = requestAnimationFrame(() => {
    const bounds = portrait.getBoundingClientRect();
    portrait.style.setProperty('--tilt-x', `${((x - bounds.left) / bounds.width - .5) * 5}deg`);
    portrait.style.setProperty('--tilt-y', `${-((y - bounds.top) / bounds.height - .5) * 4}deg`);
    portraitFrame = 0;
  });
}, { passive: true });
portrait?.addEventListener('pointerleave', () => {
  portrait.style.removeProperty('--tilt-x'); portrait.style.removeProperty('--tilt-y');
});

const progress = document.querySelector('.reading-progress');
let progressFrame = 0;
function updateProgress() {
  progressFrame = 0;
  const available = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${available > 0 ? Math.min(1, scrollY / available) : 0})`;
}
window.addEventListener('scroll', () => {
  if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
}, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();
