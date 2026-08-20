/* ==========================================================================
   YENS — interactie & subtiel bewegingsontwerp
   ========================================================================== */

import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Het contactformulier verstuurt naar Netlify Forms. Inzendingen komen binnen in
 * de Netlify-dashboard onder Forms → kennismaking; stel daar een e-mailmelding in.
 * Netlify verwerkt formulieren op de root van de site.
 */
const FORM_ACTION = '/';
const CONTACT_EMAIL = 'hallo@yens.be';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
let smoothScroll = null;

/* --------------------------------------------------------------------------
   Merkintro — minimalistische signature reveal
   -------------------------------------------------------------------------- */
function initBrandIntro() {
  const intro = $('[data-brand-intro]');
  if (!intro) return;
  const surface = $('.signature-intro__surface', intro);
  const y = $('.signature-intro__letter--y', intro);
  const e = $('.signature-intro__letter--e', intro);
  const n = $('.signature-intro__letter--n', intro);
  const s = $('.signature-intro__letter--s', intro);
  const guideLines = $$('.signature-intro__guides span', intro);
  const headerBrand = $('.nav .brand');
  const headerWordmark = $('.nav .brand__image');
  const heroParts = [
    $('.hero__media'),
    $('.hero__eyebrow'),
    $('.hero__title'),
    $('.hero__desc'),
    $('.hero__actions'),
    $('.hero__note')
  ].filter(Boolean);
  const ease = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
  const labels = Object.freeze({
    arrival: 0,
    lock: 1200,
    compression: 1650,
    symbolLock: 2850,
    heroHandoff: 3300,
    complete: 4200
  });
  let activeAnimations = [];
  let isPlaying = false;

  const timing = (delay, duration, fill = 'forwards') => ({
    delay,
    duration,
    easing: ease,
    fill
  });
  const transformTo = (rect, x, yPosition, scale = 1) => {
    const dx = x - (rect.left + rect.width / 2);
    const dy = yPosition - (rect.top + rect.height / 2);
    return `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
  };
  const cancelActiveAnimations = () => {
    activeAnimations.forEach((animation) => animation.cancel());
    activeAnimations = [];
  };

  const play = () => {
    if (reduceMotion || isPlaying) return;
    isPlaying = true;
    cancelActiveAnimations();
    document.documentElement.classList.remove('intro-seen');
    document.body.classList.add('intro-active');
    intro.style.visibility = 'visible';

    window.requestAnimationFrame(() => {
      const startTime = document.timeline.currentTime;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const yRect = y.getBoundingClientRect();
      const letterRects = new Map([[e, e.getBoundingClientRect()], [n, n.getBoundingClientRect()], [s, s.getBoundingClientRect()]]);
      const headerRect = headerWordmark.getBoundingClientRect();
      const symbolWidth = Math.min(112, Math.max(78, window.innerWidth * .105));
      const symbolScale = symbolWidth / yRect.width;
      const symbolTransform = transformTo(yRect, centerX, centerY, symbolScale);
      const symbolApproach = transformTo(yRect, centerX, centerY + 10, symbolScale);
      const symbolCorrection = transformTo(yRect, centerX, centerY - 2, symbolScale);
      const headerX = headerRect.left + headerRect.width * .189;
      const headerY = headerRect.top + headerRect.height * .5;
      const headerScale = (headerRect.width * .285) / yRect.width;
      const headerTransform = transformTo(yRect, headerX, headerY, headerScale);
      const animations = [];
      const add = (target, keyframes, options) => {
        const animation = target.animate(keyframes, options);
        animations.push(animation);
        return animation;
      };

      [
        { target: y, delay: 0, from: 'translate3d(-115vw, 0, 0)', overshoot: 'translate3d(10px, 0, 0)' },
        { target: e, delay: 60, from: 'translate3d(-78vw, 0, 0)', overshoot: 'translate3d(8px, 0, 0)' },
        { target: n, delay: 120, from: 'translate3d(78vw, 0, 0)', overshoot: 'translate3d(-8px, 0, 0)' },
        { target: s, delay: 180, from: 'translate3d(115vw, 0, 0)', overshoot: 'translate3d(-10px, 0, 0)' }
      ].forEach(({ target, delay, from, overshoot }) => {
        add(target, [
          { opacity: 1, transform: from },
          { opacity: 1, transform: overshoot }
        ], timing(labels.arrival + delay, labels.lock - delay));
        add(target, [
          { transform: overshoot },
          { transform: overshoot.replace(/-?\d+px/, (value) => `${Number.parseFloat(value) * -.2}px`), offset: .72 },
          { transform: 'translate3d(0, 0, 0)' }
        ], timing(labels.lock, labels.compression - labels.lock));
      });

      guideLines.forEach((line, index) => {
        add(line, [
          { opacity: .04, transform: 'scaleX(0)' },
          { opacity: .12, transform: 'scaleX(1)' }
        ], timing(labels.arrival + index * 60, labels.lock - index * 60));
        add(line, [
          { opacity: .12, transform: 'scaleX(1)' },
          { opacity: .16, transform: 'scaleX(.985)', offset: .68 },
          { opacity: .12, transform: 'scaleX(1)' }
        ], timing(labels.lock, labels.compression - labels.lock));
        add(line, [
          { opacity: .12, transform: 'scaleX(1)' },
          { opacity: 0, transform: 'scaleX(0)' }
        ], timing(labels.compression, labels.symbolLock - labels.compression));
      });

      add(y, [
        { transform: 'translate3d(0, 0, 0)' },
        { transform: symbolApproach }
      ], timing(labels.compression, labels.symbolLock - labels.compression));

      letterRects.forEach((rect, letter) => {
        const scale = letter === s ? .12 : .16;
        add(letter, [
          { opacity: 1, clipPath: 'inset(0 0 0 0)', transform: 'translate3d(0, 0, 0) scale(1)' },
          { opacity: 1, clipPath: 'inset(0 18% 0 18%)', transform: transformTo(rect, centerX, centerY, .55), offset: .64 },
          { opacity: 0, clipPath: 'inset(0 50% 0 50%)', transform: transformTo(rect, centerX, centerY, scale) }
        ], timing(labels.compression, labels.symbolLock - labels.compression));
      });

      add(y, [
        { transform: symbolApproach },
        { transform: symbolCorrection, offset: .46 },
        { transform: symbolTransform, offset: .56 },
        { transform: symbolTransform }
      ], timing(labels.symbolLock, labels.heroHandoff - labels.symbolLock));

      add(surface, [
        { opacity: 1 },
        { opacity: 0 }
      ], timing(labels.heroHandoff, 800, 'both'));
      add(y, [
        { opacity: 1, transform: symbolTransform },
        { opacity: 1, transform: headerTransform }
      ], timing(labels.heroHandoff, 700));

      heroParts.forEach((part, index) => {
        add(part, [
          { opacity: 0, transform: 'translate3d(0, 14px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' }
        ], timing(labels.heroHandoff + 120 + index * 55, 470, 'both'));
      });

      if (headerWordmark) {
        add(headerWordmark, [
          { opacity: 0, clipPath: 'inset(0 0 0 100%)' },
          { opacity: 1, clipPath: 'inset(0 0 0 28.5%)' }
        ], timing(labels.heroHandoff + 700, 200, 'both'));
      }

      const masterClock = add(intro, [{ opacity: 1 }, { opacity: 1 }], timing(0, labels.complete, 'both'));
      animations.forEach((animation) => { animation.startTime = startTime; });
      activeAnimations = animations;
      masterClock.finished.then(() => {
        intro.style.visibility = 'hidden';
        document.body.classList.remove('intro-active');
        document.documentElement.classList.add('intro-seen');
        cancelActiveAnimations();
        isPlaying = false;
        try { sessionStorage.setItem('yens-brand-intro-v4', '1'); } catch (_) {}
      });
    });
  };

  headerBrand?.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'auto' });
    play();
  });

  let hasSeenIntro = false;
  const isIntroPreview = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  try { hasSeenIntro = !isIntroPreview && sessionStorage.getItem('yens-brand-intro-v4') === '1'; } catch (_) {}
  if (reduceMotion || hasSeenIntro) {
    intro.style.visibility = 'hidden';
    document.body.classList.remove('intro-active');
  } else {
    window.requestAnimationFrame(play);
  }
}

/* --------------------------------------------------------------------------
   Scrollgevoel — subtiele desktopinertie, native touch en reduced motion
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduceMotion || !finePointer) return;

  smoothScroll = new Lenis({
    autoRaf: true,
    duration: 0.82,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.92,
    anchors: {
      offset: -96,
      duration: 0.68,
      easing: (t) => 1 - Math.pow(1 - t, 4)
    }
  });
}

/* --------------------------------------------------------------------------
   Thema — licht is de standaardidentiteit, donker is een bewuste keuze
   -------------------------------------------------------------------------- */
function initTheme() {
  const root = document.documentElement;
  if (localStorage.getItem('yens-theme') === 'dark') {
    root.setAttribute('data-theme', 'dark');
  }

  const toggle = $('#theme-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (isDark) {
      root.removeAttribute('data-theme');
      localStorage.setItem('yens-theme', 'light');
    } else {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('yens-theme', 'dark');
    }
  });
}

/* --------------------------------------------------------------------------
   Navigatie: scrollstatus + mobiel menu
   -------------------------------------------------------------------------- */
function initNav() {
  const nav = $('#nav');
  const burger = $('#nav-burger');
  const panel = $('#nav-mobile');
  const homeHero = $('.home-page .hero');
  const desktopLinks = nav ? $('.nav__links', nav) : null;
  const navActions = nav ? $('.nav__actions', nav) : null;
  let lastScrollY = window.scrollY;
  let navTicking = false;

  if (nav) {
    nav.classList.add('is-initializing');
    if (desktopLinks) nav.appendChild(desktopLinks);

    const updateNav = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollingDown = currentScrollY > lastScrollY + 0.5;
      const scrollingUp = currentScrollY < lastScrollY - 0.5;
      const menuOpen = panel?.classList.contains('is-open');
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth <= 900;
      const wideWidth = viewportWidth;
      const wideHeight = isMobile ? 76 : 84;
      const compactHeight = 46;
      const widePadding = isMobile
        ? 24
        : Math.min(Math.max(viewportWidth * 0.032, 24), 60);
      const compactPadding = isMobile ? 12 : 14;
      const fullBrandWidth = isMobile ? 80 : 94;
      const compactBrandWidth = isMobile ? 27 : 31;
      const compactGap = isMobile ? 7 : 15;
      const linkItems = desktopLinks ? Array.from(desktopLinks.children) : [];
      const linksWidth = linkItems.reduce((total, item) => total + item.offsetWidth, 0)
        + Math.max(linkItems.length - 1, 0) * compactGap;
      const actionItems = navActions ? Array.from(navActions.children) : [];
      const actionsWidth = actionItems.reduce((total, item) => total + item.offsetWidth, 0);
      const measuredCompactWidth = isMobile
        ? 216
        : compactBrandWidth
          + (linksWidth || 410)
          + (actionsWidth || 44)
          + compactGap * 2
          + compactPadding * 2;
      const compactWidth = Math.min(
        Math.ceil(measuredCompactWidth),
        viewportWidth - (isMobile ? 16 : 32)
      );
      const compactLinksLeft = (viewportWidth - compactWidth) / 2
        + compactPadding + compactBrandWidth + compactGap;
      const shouldCompact = currentScrollY > 24;
      const morphProgress = shouldCompact ? 1 : 0;
      let heroIsOutOfView = true;

      if (homeHero) {
        const heroRect = homeHero.getBoundingClientRect();
        heroIsOutOfView = heroRect.bottom <= 0;
      }

      const shellWidth = wideWidth + (compactWidth - wideWidth) * morphProgress;
      const shellHeight = wideHeight + (compactHeight - wideHeight) * morphProgress;
      const shellPadding = widePadding + (compactPadding - widePadding) * morphProgress;
      const brandWidth = fullBrandWidth + (compactBrandWidth - fullBrandWidth) * morphProgress;
      const expandedOffset = isMobile ? 12 : 18;
      const compactOffset = isMobile ? 24 : 32;
      const shellOffset = expandedOffset
        + (compactOffset - expandedOffset) * morphProgress;

      nav.style.setProperty('--nav-shell-width', `${Math.round(shellWidth)}px`);
      nav.style.setProperty('--nav-compact-links-left', `${compactLinksLeft.toFixed(2)}px`);
      nav.style.setProperty('--nav-shell-height', `${shellHeight.toFixed(2)}px`);
      nav.style.setProperty('--nav-shell-padding', `${shellPadding.toFixed(2)}px`);
      nav.style.setProperty('--nav-surface-opacity', morphProgress.toFixed(3));
      nav.style.setProperty('--nav-brand-width', `${brandWidth.toFixed(2)}px`);
      nav.style.setProperty('--nav-shell-y', `${shellOffset.toFixed(2)}px`);

      nav.classList.toggle('is-scrolled', shouldCompact);
      nav.classList.toggle('is-compact', shouldCompact);

      if (!heroIsOutOfView || menuOpen) {
        nav.classList.remove('is-hidden');
      } else if (currentScrollY > 160 && scrollingDown) {
        nav.classList.add('is-hidden');
      } else if (scrollingUp || currentScrollY <= 80) {
        nav.classList.remove('is-hidden');
      }

      lastScrollY = currentScrollY;
      navTicking = false;
    };

    const onScroll = () => {
      if (navTicking) return;
      navTicking = true;
      window.requestAnimationFrame(updateNav);
    };

    updateNav();
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => nav.classList.remove('is-initializing'));
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  if (!burger || !panel) return;

  const setOpen = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    panel.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    if (smoothScroll) {
      if (open) smoothScroll.stop();
      else smoothScroll.start();
    }
    nav?.classList.remove('is-hidden');
  };

  burger.addEventListener('click', () => {
    setOpen(burger.getAttribute('aria-expanded') !== 'true');
  });

  $$('a', panel).forEach((link) => link.addEventListener('click', () => setOpen(false)));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      burger.focus();
    }
  });
}

/* --------------------------------------------------------------------------
   Reveal-animaties
   -------------------------------------------------------------------------- */
function initReveal() {
  const items = $$('[data-reveal]');
  if (!items.length) return;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  items.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   Werkwijze: lijn die meeloopt met de scrollpositie
   -------------------------------------------------------------------------- */
function initProcess() {
  const process = $('#process');
  const progress = $('#process-progress');
  if (!process || !progress) return;

  const steps = $$('[data-step]', process);

  if (reduceMotion) {
    progress.style.height = '100%';
    steps.forEach((s) => s.classList.add('is-reached'));
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = process.getBoundingClientRect();
    const anchor = window.innerHeight * 0.62;
    const ratio = (anchor - rect.top) / rect.height;
    const clamped = Math.min(Math.max(ratio, 0), 1);

    progress.style.height = `${clamped * 100}%`;
    steps.forEach((step) => {
      const dot = $('.process__point, .step__dot', step);
      if (!dot) return;
      const dotRect = dot.getBoundingClientRect();
      step.classList.toggle('is-reached', dotRect.top + dotRect.height / 2 < anchor);
    });
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

/* --------------------------------------------------------------------------
   Zachte parallax op beeldkaders
   -------------------------------------------------------------------------- */
function initParallax() {
  const items = $$('[data-parallax]');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!items.length || reduceMotion || !finePointer) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const viewport = window.innerHeight;
    items.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewport) return;
      const strength = parseFloat(el.dataset.parallax) || 0.05;
      const offset = (rect.top + rect.height / 2 - viewport / 2) * -strength;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

/* --------------------------------------------------------------------------
   FAQ-accordion
   -------------------------------------------------------------------------- */
function initFaq() {
  $$('[data-faq]').forEach((group) => {
    const triggers = $$('.faq__trigger', group);

    triggers.forEach((trigger) => {
      const panel = trigger.closest('.faq__item').querySelector('.faq__panel');

      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';

        // Eén vraag tegelijk open — rustiger beeld
        triggers.forEach((other) => {
          if (other === trigger) return;
          other.setAttribute('aria-expanded', 'false');
          const otherPanel = other.closest('.faq__item').querySelector('.faq__panel');
          otherPanel.style.height = '0px';
        });

        trigger.setAttribute('aria-expanded', String(!isOpen));
        panel.style.height = isOpen ? '0px' : `${panel.scrollHeight}px`;
      });
    });

    triggers.forEach((trigger) => {
      if (trigger.getAttribute('aria-expanded') !== 'true') return;
      const panel = trigger.closest('.faq__item').querySelector('.faq__panel');
      panel.style.height = `${panel.scrollHeight}px`;
    });

    window.addEventListener('resize', () => {
      triggers.forEach((trigger) => {
        if (trigger.getAttribute('aria-expanded') !== 'true') return;
        const panel = trigger.closest('.faq__item').querySelector('.faq__panel');
        panel.style.height = `${panel.scrollHeight}px`;
      });
    });
  });
}

/* --------------------------------------------------------------------------
   Sticky mobiele CTA — verschijnt pas voorbij de hero
   -------------------------------------------------------------------------- */
function initStickyCta() {
  const cta = $('#sticky-cta');
  if (!cta) return;

  const onScroll = () => {
    cta.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.7);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* --------------------------------------------------------------------------
   Kennis: filteren op categorie
   -------------------------------------------------------------------------- */
function initFilters() {
  const bar = $('[data-filters]');
  if (!bar) return;

  const buttons = $$('.filter', bar);
  const cards = $$('[data-category]');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.filter;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      cards.forEach((card) => {
        const match = value === 'alle' || card.dataset.category === value;
        card.classList.toggle('is-hidden', !match);
      });
    });
  });
}

/* --------------------------------------------------------------------------
   Contactformulier: validatie, spamveld en verzending
   -------------------------------------------------------------------------- */
function initForm() {
  const form = $('#contact-form');
  if (!form) return;

  const status = $('#form-status');

  // Velden voorinvullen vanuit een link, bv. /contact.html?locatie=kontich
  const params = new URLSearchParams(window.location.search);
  ['locatie', 'begeleiding'].forEach((name) => {
    const value = params.get(name);
    const field = form.querySelector(`[name="${name}"]`);
    if (!value || !field) return;
    if (Array.from(field.options).some((o) => o.value === value)) field.value = value;
  });

  const showStatus = (message) => {
    if (!status) return;
    status.textContent = message;
    status.hidden = false;
  };

  const clearError = (field) => {
    field.closest('.field')?.classList.remove('field--error');
    field.closest('.field')?.querySelector('.field__error')?.remove();
  };

  const setError = (field, message) => {
    const wrapper = field.closest('.field');
    if (!wrapper || wrapper.querySelector('.field__error')) return;
    wrapper.classList.add('field--error');
    const error = document.createElement('p');
    error.className = 'field__error';
    error.textContent = message;
    wrapper.appendChild(error);
  };

  form.addEventListener('input', (e) => clearError(e.target));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot: ingevuld door bots, onzichtbaar voor bezoekers
    if (form.querySelector('[name="website"]')?.value) return;

    let valid = true;
    $$('[required]', form).forEach((field) => {
      const empty = field.type === 'checkbox' ? !field.checked : !field.value.trim();
      const badEmail = field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
      if (empty || badEmail) {
        valid = false;
        setError(field, badEmail ? 'Vul een geldig e-mailadres in.' : 'Dit veld is nog leeg.');
      }
    });

    if (!valid) {
      const first = form.querySelector('.field--error input, .field--error select, .field--error textarea');
      first?.focus();
      showStatus('Enkele velden zijn nog niet ingevuld.');
      return;
    }

    // Het honeypot-veld gaat bewust mee: Netlify controleert het serverside.
    const data = new FormData(form);
    const submit = form.querySelector('[type="submit"]');
    const label = submit.textContent;

    submit.disabled = true;
    submit.textContent = 'Versturen…';
    status.classList.remove('form__status--error');

    try {
      const response = await fetch(FORM_ACTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });
      if (!response.ok) throw new Error(`Netlify gaf status ${response.status}`);

      form.reset();
      showStatus('Bedankt, je aanvraag is verstuurd. Ik neem binnen twee werkdagen persoonlijk contact met je op.');
    } catch (error) {
      status.classList.add('form__status--error');
      showStatus(`Verzenden lukte niet. Probeer het later opnieuw of mail rechtstreeks naar ${CONTACT_EMAIL}.`);
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });
}

/* --------------------------------------------------------------------------
   Partner-marquee: exact één groepsbreedte per naadloze iteratie
   -------------------------------------------------------------------------- */
function initPartnerMarquee() {
  const track = $('.partners__track');
  const group = track ? $('.partners__group', track) : null;
  if (!track || !group) return;

  const measure = () => {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(group.getBoundingClientRect().width * dpr) / dpr;
    const template = track.children[1];
    const requiredWidth = window.innerWidth + width;

    while (template && track.children.length * width < requiredWidth) {
      const clone = template.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      $$('a', clone).forEach((link) => link.setAttribute('tabindex', '-1'));
      $$('img', clone).forEach((image) => { image.loading = 'eager'; });
      track.appendChild(clone);
    }

    track.style.setProperty('--partners-shift', `${-width}px`);
    track.classList.add('is-ready');
  };

  measure();
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measure);
    observer.observe(group);
  } else {
    window.addEventListener('resize', measure, { passive: true });
  }
}

/* --------------------------------------------------------------------------
   Begeleidingsteaser — lokale editorial cursor op desktop
   -------------------------------------------------------------------------- */
function initGuidanceCursor() {
  const cursor = $('.guidance-cursor');
  const rows = $$('.guidance-row');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!cursor || !rows.length || reduceMotion || !finePointer) return;

  const moveCursor = (event) => {
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
  };

  rows.forEach((row) => {
    row.addEventListener('pointerenter', (event) => {
      moveCursor(event);
      cursor.classList.add('is-visible');
    });
    row.addEventListener('pointermove', moveCursor);
    row.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  });
}

/* --------------------------------------------------------------------------
   Klantverhalen — klikbare panelen naast de desktop-hover en mobiele swipe
   -------------------------------------------------------------------------- */
function initStoryPanels() {
  const stories = $('[data-stories]');
  if (!stories) return;

  const panels = $$('.story-panel', stories);
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const closePanels = (except = null) => {
    panels.forEach((panel) => {
      if (panel === except) return;
      panel.classList.remove('is-active');
      panel.setAttribute('aria-expanded', 'false');
    });
  };

  panels.forEach((panel) => {
    const toggle = () => {
      const willOpen = !panel.classList.contains('is-active');
      closePanels(panel);
      panel.classList.toggle('is-active', willOpen);
      panel.setAttribute('aria-expanded', String(willOpen));
    };

    panel.addEventListener('click', toggle);
    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
      if (event.key === 'Escape') closePanels();
    });

    if (finePointer) {
      panel.addEventListener('pointerleave', () => {
        panel.classList.remove('is-active');
        panel.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

/* --------------------------------------------------------------------------
   Kleine details
   -------------------------------------------------------------------------- */
function initMisc() {
  $$('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initBrandIntro();
  initSmoothScroll();
  initTheme();
  initNav();
  initReveal();
  initProcess();
  initParallax();
  initFaq();
  initStickyCta();
  initFilters();
  initForm();
  initPartnerMarquee();
  initStoryPanels();
  initGuidanceCursor();
  initMisc();
});
