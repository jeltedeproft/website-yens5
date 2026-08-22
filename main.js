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
      const firstScreenIsOutOfView = currentScrollY >= window.innerHeight;

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

      if (!firstScreenIsOutOfView || menuOpen) {
        nav.classList.remove('is-hidden');
      } else if (scrollingDown) {
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

/* --------------------------------------------------------------------------
   Merkintro — plan, section, space
   -------------------------------------------------------------------------- */
function initBrandIntro() {
  const intro = $('[data-brand-intro]');
  if (!intro) return;

  if (reduceMotion) {
    intro.hidden = true;
    document.body.classList.remove('brand-intro-active');
    return;
  }

  const symbol = $('.brand-intro__symbol', intro);
  const symbolParts = $$('.brand-intro__symbol-part', symbol);
  const letters = $$('.brand-intro__letter', intro);
  const planes = $$('.brand-intro__plane', intro);
  const timing = {
    duration: 2720,
    formStart: 100,
    travelStart: 680,
    wordComplete: 1450,
    lockRelease: 1630,
    revealStart: 1700,
    sideRevealStart: 1760,
    logoClear: 1990,
    sideClear: 2600,
    planesClear: 2660
  };
  const duration = timing.duration;
  const at = (ms) => ms / duration;

  requestAnimationFrame(() => {
    const symbolRect = symbol.getBoundingClientRect();
    const centerOffset = window.innerWidth / 2 - (symbolRect.left + symbolRect.width / 2);
    const draw = 'cubic-bezier(.16, 1, .3, 1)';
    const assemble = 'cubic-bezier(.65, 0, .35, 1)';
    const open = 'cubic-bezier(.22, 1, .36, 1)';
    const animations = [symbol.animate([
      { offset: 0, opacity: 1, transform: `translate3d(${centerOffset}px,0,0)` },
      { offset: at(timing.travelStart), opacity: 1, transform: `translate3d(${centerOffset}px,0,0)`, easing: assemble },
      { offset: at(timing.wordComplete), opacity: 1, transform: 'translate3d(0,0,0)', easing: assemble },
      { offset: at(timing.lockRelease), opacity: 1, transform: 'translate3d(0,0,0)', easing: open },
      { offset: at(timing.logoClear), opacity: 0, transform: 'translate3d(0,0,0)' },
      { offset: 1, opacity: 0, transform: 'translate3d(0,0,0)' }
    ], { duration, easing: 'linear', fill: 'both' })];

    const partMotion = [
      { start: 170, end: 840, from: 'translate3d(0,5px,0)', clip: 'inset(0 58% 76% 0)' },
      { start: 240, end: 910, from: 'translate3d(0,7px,0)', clip: 'inset(0 0 76% 58%)' },
      { start: timing.formStart, end: 720, from: 'translate3d(0,12px,0)', clip: 'inset(48% 38% 0 38%)' }
    ];
    symbolParts.forEach((part, index) => {
      const motion = partMotion[index];
      animations.push(part.animate([
        { offset: 0, opacity: 0, transform: motion.from, clipPath: motion.clip },
        { offset: at(motion.start), opacity: 0, transform: motion.from, clipPath: motion.clip, easing: draw },
        { offset: at(motion.end), opacity: 1, transform: 'translate3d(0,0,0)', clipPath: 'inset(0)' },
        { offset: 1, opacity: 1, transform: 'translate3d(0,0,0)', clipPath: 'inset(0)' }
      ], { duration, easing: 'linear', fill: 'both' }));
    });

    const letterMotion = [
      { start: 830, end: 1320, from: 'translate3d(-10px,0,0)', closed: 'inset(48% 48.12% 48% 35.48%)', open: 'inset(0 48.12% 0 35.48%)' },
      { start: 885, end: 1390, from: 'translate3d(0,7px,0)', closed: 'inset(0 33.8% 0 65.2%)', open: 'inset(0 25.44% 0 56.11%)' },
      { start: 940, end: timing.wordComplete, from: 'translate3d(10px,0,0)', closed: 'inset(48% 4.2% 48% 78.91%)', open: 'inset(0 4.2% 0 78.91%)' }
    ];
    letters.forEach((letter, index) => {
      const motion = letterMotion[index];
      animations.push(letter.animate([
        { offset: 0, opacity: 0, transform: motion.from, clipPath: motion.closed },
        { offset: at(motion.start), opacity: 0, transform: motion.from, clipPath: motion.closed, easing: draw },
        { offset: at(motion.start + 90), opacity: .14, transform: motion.from, clipPath: motion.closed, easing: draw },
        { offset: at(motion.end), opacity: .94, transform: 'translate3d(0,0,0)', clipPath: motion.open },
        { offset: at(timing.lockRelease), opacity: .94, transform: 'translate3d(0,0,0)', clipPath: motion.open, easing: open },
        { offset: at(timing.logoClear), opacity: 0, transform: 'translate3d(0,0,0)', clipPath: motion.open },
        { offset: 1, opacity: 0, transform: 'translate3d(0,0,0)', clipPath: motion.open }
      ], { duration, easing: 'linear', fill: 'both' }));
    });

    const planeFrames = [
      [
        { offset: 0, transform: 'scaleY(1)' },
        { offset: at(timing.revealStart), transform: 'scaleY(1)', easing: open },
        { offset: at(timing.planesClear), transform: 'scaleY(0)' },
        { offset: 1, transform: 'scaleY(0)' }
      ],
      [
        { offset: 0, transform: 'scaleX(1)' },
        { offset: at(timing.sideRevealStart), transform: 'scaleX(1)', easing: open },
        { offset: at(timing.sideClear), transform: 'scaleX(0)' },
        { offset: 1, transform: 'scaleX(0)' }
      ]
    ];
    planes.forEach((plane, index) => {
      const axis = index === 0 || index === 2 ? 0 : 1;
      animations.push(plane.animate(planeFrames[axis], { duration, easing: 'linear', fill: 'both' }));
    });

    const clock = intro.animate([
      { offset: 0, opacity: 1 },
      { offset: at(timing.planesClear), opacity: 1 },
      { offset: 1, opacity: 0 }
    ], { duration, easing: 'linear', fill: 'both' });
    animations.push(clock);

    const startTime = document.timeline.currentTime;
    animations.forEach((animation) => { animation.startTime = startTime; });
    clock.finished.then(() => {
      intro.hidden = true;
      document.body.classList.remove('brand-intro-active');
      animations.forEach((animation) => animation.cancel());
    });
  });
}

function initBrandRefresh() {
  const brand = $('.nav .brand');
  if (!brand) return;
  brand.addEventListener('click', (event) => {
    const isHomepage = location.pathname === '/' || location.pathname.endsWith('/index.html');
    if (!isHomepage) return;
    event.preventDefault();
    location.reload();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initBrandIntro();
  initBrandRefresh();
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
