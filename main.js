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
   Navigatie: scrollstatus + mobiel menu
   -------------------------------------------------------------------------- */
function initNav() {
  const nav = $('#nav');
  const burger = $('#nav-burger');
  const panel = $('#nav-mobile');
  const desktopLinks = nav ? $('.nav__links', nav) : null;
  const navActions = nav ? $('.nav__actions', nav) : null;
  let directionAnchorY = Math.max(window.scrollY, 0);
  let navTicking = false;

  if (nav) {
    nav.classList.add('is-initializing');
    if (desktopLinks) nav.appendChild(desktopLinks);

    const updateNav = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const directionDelta = currentScrollY - directionAnchorY;
      const hasDirectionChange = Math.abs(directionDelta) >= 2;
      const scrollingDown = hasDirectionChange && directionDelta > 0;
      const scrollingUp = hasDirectionChange && directionDelta < 0;
      if (hasDirectionChange) directionAnchorY = currentScrollY;
      const menuOpen = panel?.classList.contains('is-open');
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth <= 900;
      const shouldCompact = currentScrollY > 24;
      nav.classList.toggle('is-compact', shouldCompact);
      const wideWidth = viewportWidth;
      const wideHeight = isMobile ? 76 : 84;
      const compactHeight = 50;
      const widePadding = isMobile
        ? 24
        : Math.min(Math.max(viewportWidth * 0.032, 24), 60);
      const compactPadding = isMobile ? 14 : 16;
      const fullBrandWidth = isMobile ? 80 : 94;
      const compactBrandWidth = isMobile ? 31 : 35;
      const compactGap = isMobile ? 8 : 16;
      const linksWidth = desktopLinks?.offsetWidth || 0;
      const actionItems = navActions ? Array.from(navActions.children) : [];
      const actionsWidth = actionItems.reduce((total, item) => total + item.offsetWidth, 0);
      const measuredCompactWidth = isMobile
        ? 216
        : Math.max(compactBrandWidth, actionsWidth) * 2
          + (linksWidth || 410)
          + compactGap * 2
          + compactPadding * 2;
      const compactWidth = Math.min(
        Math.ceil(measuredCompactWidth),
        viewportWidth - (isMobile ? 16 : 32)
      );
      const morphProgress = shouldCompact ? 1 : 0;
      const firstScreenIsOutOfView = currentScrollY >= window.innerHeight;

      const shellWidth = wideWidth + (compactWidth - wideWidth) * morphProgress;
      const shellHeight = wideHeight + (compactHeight - wideHeight) * morphProgress;
      const shellPadding = widePadding + (compactPadding - widePadding) * morphProgress;
      const brandWidth = fullBrandWidth + (compactBrandWidth - fullBrandWidth) * morphProgress;
      const expandedOffset = isMobile ? 12 : 18;
      const compactOffset = isMobile ? 24 : 35;
      const shellOffset = expandedOffset
        + (compactOffset - expandedOffset) * morphProgress;

      nav.style.setProperty('--nav-shell-width', `${Math.round(shellWidth)}px`);
      nav.style.setProperty('--nav-shell-height', `${shellHeight.toFixed(2)}px`);
      nav.style.setProperty('--nav-shell-padding', `${shellPadding.toFixed(2)}px`);
      nav.style.setProperty('--nav-surface-opacity', morphProgress.toFixed(3));
      nav.style.setProperty('--nav-brand-width', `${brandWidth.toFixed(2)}px`);
      nav.style.setProperty('--nav-shell-y', `${shellOffset.toFixed(2)}px`);

      nav.classList.toggle('is-scrolled', shouldCompact);

      if (!firstScreenIsOutOfView || menuOpen) {
        nav.classList.remove('is-hidden');
      } else if (scrollingDown || nav.classList.contains('is-initializing')) {
        nav.classList.add('is-hidden');
      } else if (scrollingUp) {
        nav.classList.remove('is-hidden');
      }

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
function initBrandIntroStructural() {
  const intro = $('[data-brand-intro]');
  if (!intro) return;

  if (reduceMotion) {
    intro.hidden = true;
    document.body.classList.remove('brand-intro-active');
    document.body.classList.add('is-loaded');
    return;
  }

  const lockup = $('.brand-intro__lockup', intro);
  const wordmark = $('.brand-intro__wordmark', intro);
  const yFrame = $('.brand-intro__y-frame', intro);
  const yParts = $$('.brand-intro__y-part', intro);
  const colorWipe = $('.brand-intro__color-wipe', intro);
  const letters = $$('.brand-intro__letter-group:not(.brand-intro__letter-group--y)', intro);
  const surfaces = $$('.brand-intro__surface', intro);
  const axis = $('.brand-intro__axis', intro);
  const nav = $('.nav');
  const heroMedia = $('.hero__media');
  const heroImage = $('.hero__media img');
  const heroEyebrow = $('.hero__eyebrow');
  const heroLines = $$('.hero__title .line > span');
  const heroDesc = $('.hero__desc');
  const heroActions = $('.hero__actions');
  const timing = {
    duration: 2960,
    axisIn: 80,
    stemStart: 130,
    stemEnd: 650,
    leftStart: 210,
    leftEnd: 750,
    rightStart: 265,
    rightEnd: 815,
    spaceStart: 610,
    eStart: 790,
    nStart: 840,
    sStart: 890,
    eEnd: 1280,
    nEnd: 1360,
    wordComplete: 1440,
    colorStart: 835,
    colorEnd: 1230,
    releaseStart: 1580,
    apertureStart: 1640,
    mediaStart: 1690,
    logoClear: 1900,
    navStart: 1980,
    copyStart: 1880,
    surfacesClear: 2860
  };
  const duration = timing.duration;
  const at = (ms) => ms / duration;
  const formEase = 'cubic-bezier(.16, 1, .3, 1)';
  const assembleEase = 'cubic-bezier(.45, 0, .2, 1)';
  const releaseEase = 'cubic-bezier(.22, 1, .36, 1)';
  let animations = [];
  let clock = null;
  let resizeFrame = 0;
  let finished = false;

  const addTrack = (element, frames) => {
    if (!element) return null;
    const animation = element.animate(frames, { duration, easing: 'linear', fill: 'both' });
    animations.push(animation);
    return animation;
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    window.removeEventListener('resize', onResize);
    document.body.classList.add('is-loaded', 'hero-intro-complete');
    document.body.classList.remove('brand-intro-active');
    intro.hidden = true;
    animations.forEach((animation) => animation.cancel());
  };

  const buildTimeline = (resumeAt = 0) => {
    animations.forEach((animation) => animation.cancel());
    animations = [];

    const lockupRect = lockup.getBoundingClientRect();
    // Exacte geometrie uit het officiële 1073 × 390 woordmerk.
    // De Y loopt lokaal van x=25 tot x=738 en gebruikt de officiële schaal/offset.
    const yCenterInViewBox = 50.113171 + ((25 + 738) / 2) * 0.4024390243902439;
    const centerOffset = (1073 / 2 - yCenterInViewBox) * (lockupRect.width / 1073);

    addTrack(axis, [
      { offset: 0, opacity: 0, transform: 'translate3d(-.5px,-50%,0) scaleY(0)' },
      { offset: at(timing.axisIn), opacity: 0, transform: 'translate3d(-.5px,-50%,0) scaleY(0)', easing: formEase },
      { offset: at(430), opacity: .58, transform: 'translate3d(-.5px,-50%,0) scaleY(1)' },
      { offset: at(timing.wordComplete), opacity: .24, transform: 'translate3d(-.5px,-50%,0) scaleY(1)', easing: assembleEase },
      { offset: at(timing.apertureStart), opacity: 0, transform: 'translate3d(-.5px,-50%,0) scaleY(.08)' },
      { offset: 1, opacity: 0, transform: 'translate3d(-.5px,-50%,0) scaleY(0)' }
    ]);

    addTrack(yFrame, [
      { offset: 0, transform: `translate3d(${centerOffset}px,0,0)` },
      { offset: at(timing.spaceStart), transform: `translate3d(${centerOffset}px,0,0)`, easing: assembleEase },
      { offset: at(timing.wordComplete), transform: 'translate3d(0,0,0)' },
      { offset: 1, transform: 'translate3d(0,0,0)' }
    ]);

    const yMotion = [
      { start: timing.leftStart, end: timing.leftEnd, from: 'translate3d(1px,5px,0)' },
      { start: timing.rightStart, end: timing.rightEnd, from: 'translate3d(-1px,7px,0)' },
      { start: timing.stemStart, end: timing.stemEnd, from: 'translate3d(0,10px,0)' }
    ];
    yParts.forEach((part, index) => {
      const motion = yMotion[index];
      addTrack(part, [
        { offset: 0, opacity: 0, transform: motion.from },
        { offset: at(motion.start), opacity: 0, transform: motion.from, easing: formEase },
        { offset: at(motion.end), opacity: 1, transform: 'translate3d(0,0,0)' },
        { offset: 1, opacity: 1, transform: 'translate3d(0,0,0)' }
      ]);
    });

    addTrack(colorWipe, [
      { offset: 0, transform: 'scaleX(0)' },
      { offset: at(timing.colorStart), transform: 'scaleX(0)', easing: assembleEase },
      { offset: at(timing.colorEnd), transform: 'scaleX(1)' },
      { offset: 1, transform: 'scaleX(1)' }
    ]);

    const letterTimes = [
      [timing.eStart, timing.eEnd],
      [timing.nStart, timing.nEnd],
      [timing.sStart, timing.wordComplete]
    ];
    letters.forEach((letter, index) => {
      const [start, end] = letterTimes[index];
      addTrack(letter, [
        { offset: 0, opacity: 0, transform: 'translate3d(-5px,0,0)', clipPath: 'inset(0 100% 0 0)' },
        { offset: at(start), opacity: 0, transform: 'translate3d(-5px,0,0)', clipPath: 'inset(0 100% 0 0)', easing: assembleEase },
        { offset: at(end), opacity: 1, transform: 'translate3d(0,0,0)', clipPath: 'inset(0)' },
        { offset: 1, opacity: 1, transform: 'translate3d(0,0,0)', clipPath: 'inset(0)' }
      ]);
    });

    addTrack(wordmark, [
      { offset: 0, opacity: 1 },
      { offset: at(timing.releaseStart), opacity: 1, easing: releaseEase },
      { offset: at(timing.logoClear), opacity: 0 },
      { offset: 1, opacity: 0 }
    ]);

    surfaces.forEach((surface, index) => addTrack(surface, [
      { offset: 0, transform: 'translate3d(0,0,0)' },
      { offset: at(timing.apertureStart), transform: 'translate3d(0,0,0)', easing: releaseEase },
      { offset: at(timing.surfacesClear), transform: `translate3d(0,${index === 0 ? '-100.2%' : '100.2%'},0)` },
      { offset: 1, transform: `translate3d(0,${index === 0 ? '-100.2%' : '100.2%'},0)` }
    ]));

    addTrack(heroMedia, [
      { offset: 0, opacity: 0 },
      { offset: at(timing.mediaStart), opacity: 0, easing: releaseEase },
      { offset: at(2360), opacity: 1 },
      { offset: 1, opacity: 1 }
    ]);
    addTrack(heroImage, [
      { offset: 0, transform: 'scale(1.06)' },
      { offset: at(timing.mediaStart), transform: 'scale(1.06)', easing: releaseEase },
      { offset: 1, transform: 'scale(1.035)' }
    ]);
    addTrack(nav, [
      { offset: 0, opacity: 0 },
      { offset: at(timing.navStart), opacity: 0, easing: formEase },
      { offset: at(2250), opacity: 1 },
      { offset: 1, opacity: 1 }
    ]);

    const revealTrack = (element, start, end, from = 'translate3d(0,16px,0)') => addTrack(element, [
      { offset: 0, opacity: 0, transform: from },
      { offset: at(start), opacity: 0, transform: from, easing: formEase },
      { offset: at(end), opacity: 1, transform: 'translate3d(0,0,0)' },
      { offset: 1, opacity: 1, transform: 'translate3d(0,0,0)' }
    ]);
    revealTrack(heroEyebrow, timing.copyStart, 2250, 'translate3d(0,12px,0)');
    heroLines.forEach((line, index) => revealTrack(line, 1940 + index * 55, 2390 + index * 55, 'translate3d(0,108%,0)'));
    revealTrack(heroDesc, 2080, 2510);
    revealTrack(heroActions, 2140, 2570);

    clock = addTrack(intro, [
      { offset: 0, opacity: 1 },
      { offset: at(timing.surfacesClear), opacity: 1 },
      { offset: 1, opacity: 0 }
    ]);

    const startTime = document.timeline.currentTime - resumeAt;
    animations.forEach((animation) => { animation.startTime = startTime; });
    clock.finished.then(finish).catch(() => {});
  };

  const onResize = () => {
    if (finished || resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      const currentTime = Math.min(clock?.currentTime || 0, duration - 1);
      buildTimeline(currentTime);
    });
  };

  window.addEventListener('resize', onResize, { passive: true });
  requestAnimationFrame(() => buildTimeline());
}

function initBrandIntro() {
  const intro = $('[data-brand-intro]');
  if (!intro) return;

  let replayRequested = false;
  try {
    replayRequested = sessionStorage.getItem('yens-intro-replay') === '1';
    sessionStorage.removeItem('yens-intro-replay');
  } catch (_) {}
  const shouldPlay = typeof window.yensBrandIntroShouldPlay === 'boolean'
    ? window.yensBrandIntroShouldPlay
    : performance.getEntriesByType('navigation')[0]?.type === 'reload' || replayRequested;

  if (!shouldPlay) {
    intro.hidden = true;
    document.documentElement.classList.remove('skip-brand-intro');
    document.body.classList.remove('brand-intro-active');
    document.body.classList.add('intro-complete');
    return;
  }

  try { sessionStorage.setItem('yens-intro-seen', '1'); } catch (_) {}

  if (reduceMotion) {
    intro.hidden = true;
    document.body.classList.remove('brand-intro-active');
    document.body.classList.add('intro-complete');
    return;
  }

  // De homepage staat vanaf het begin stabiel achter het volledig dekkende vlak.
  // Daardoor worden logo en copy niet pas na de aperture opnieuw gepositioneerd.
  document.body.classList.add('intro-complete');

  const symbol = $('.brand-intro__symbol', intro);
  const letters = $$('.brand-intro__letter', intro);
  const timing = {
    duration: 2800,
    formStart: 100,
    travelStart: 680,
    wordComplete: 1450,
    lockRelease: 1560,
    sExitStart: 1560,
    nExitStart: 1580,
    eExitStart: 1600,
    yExitStart: 1620,
    sExitEnd: 2060,
    nExitEnd: 2080,
    eExitEnd: 2100,
    logoClear: 2120,
    overlayFadeStart: 1860
  };
  const duration = timing.duration;
  const at = (ms) => ms / duration;

  requestAnimationFrame(() => {
    const symbolRect = symbol.getBoundingClientRect();
    const centerOffset = window.innerWidth / 2 - (symbolRect.left + symbolRect.width / 2);
    const easing = {
      form: 'cubic-bezier(.16, 1, .3, 1)',
      assemble: 'cubic-bezier(.45, 0, .2, 1)',
      release: 'cubic-bezier(.22, .61, .36, 1)'
    };
    const animations = [symbol.animate([
      { offset: 0, opacity: 0, transform: `translate3d(${centerOffset}px,0,0)`, clipPath: 'inset(49% 24% 49% 24%)' },
      { offset: at(timing.formStart), opacity: 0, transform: `translate3d(${centerOffset}px,0,0)`, clipPath: 'inset(49% 24% 49% 24%)', easing: easing.form },
      { offset: at(timing.travelStart), opacity: 1, transform: `translate3d(${centerOffset}px,0,0)`, clipPath: 'inset(0)', easing: easing.assemble },
      { offset: at(timing.wordComplete), opacity: 1, transform: 'translate3d(0,0,0)' },
      { offset: at(timing.yExitStart), opacity: 1, transform: 'translate3d(0,0,0)', clipPath: 'inset(0)', easing: easing.release },
      { offset: at(timing.logoClear), opacity: 0, transform: 'translate3d(0,-1px,0)', clipPath: 'inset(0)' },
      { offset: 1, opacity: 0, transform: 'translate3d(0,-1px,0)', clipPath: 'inset(0)' }
    ], { duration, easing: 'linear', fill: 'both' })];

    const letterMotion = [
      { start: 820, end: 1300, exitStart: timing.eExitStart, exitEnd: timing.eExitEnd, from: 'translate3d(-6px,0,0)', closed: 'inset(0 72.125% 0 27.875%)', open: 'inset(0 53.426% 0 27.875%)' },
      { start: 875, end: 1375, exitStart: timing.nExitStart, exitEnd: timing.nExitEnd, from: 'translate3d(-6px,0,0)', closed: 'inset(0 48.432% 0 51.568%)', open: 'inset(0 27.294% 0 51.568%)' },
      { start: 930, end: timing.wordComplete, exitStart: timing.sExitStart, exitEnd: timing.sExitEnd, from: 'translate3d(-6px,0,0)', closed: 'inset(0 22.764% 0 77.236%)', open: 'inset(0 1.858% 0 77.236%)' }
    ];
    letters.forEach((letter, index) => {
      const motion = letterMotion[index];
      animations.push(letter.animate([
        { offset: 0, opacity: 0, transform: motion.from, clipPath: motion.closed },
        { offset: at(motion.start), opacity: 0, transform: motion.from, clipPath: motion.closed, easing: easing.form },
        { offset: at(motion.end), opacity: .94, transform: 'translate3d(0,0,0)', clipPath: motion.open },
        { offset: at(motion.exitStart), opacity: .94, transform: 'translate3d(0,0,0)', clipPath: motion.open, easing: easing.release },
        { offset: at(motion.exitEnd), opacity: 0, transform: 'translate3d(0,-1px,0)', clipPath: motion.open },
        { offset: 1, opacity: 0, transform: 'translate3d(0,-1px,0)', clipPath: motion.open }
      ], { duration, easing: 'linear', fill: 'both' }));
    });

    const clock = intro.animate([
      { offset: 0, opacity: 1 },
      { offset: at(timing.overlayFadeStart), opacity: 1, easing: easing.release },
      { offset: 1, opacity: 0 }
    ], { duration, easing: 'linear', fill: 'both' });
    animations.push(clock);

    const startTime = document.timeline.currentTime;
    animations.forEach((animation) => { animation.startTime = startTime; });
    clock.finished.then(() => {
      document.body.classList.add('intro-complete');
      document.body.classList.remove('brand-intro-active');
      intro.hidden = true;
      animations.forEach((animation) => animation.cancel());
    });
  });
}

function initBrandRefresh() {
  const brand = $('.nav .brand');
  if (!brand) return;
  brand.addEventListener('click', (event) => {
    event.preventDefault();
    try {
      sessionStorage.setItem('yens-intro-replay', '1');
    } catch (_) {}
    const target = new URL(brand.href, location.href);
    const isCurrentPage = target.pathname === location.pathname;
    if (isCurrentPage) location.reload();
    else location.assign(target.href);
  });
}

function initInternalHomeNavigation() {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    const link = event.target.closest('a[href]');
    if (!link || link.closest('.brand') || link.target === '_blank' || link.hasAttribute('download')) return;

    const target = new URL(link.href, location.href);
    const isHome = target.origin === location.origin
      && (target.pathname === '/' || target.pathname.endsWith('/index.html'));
    if (!isHome) return;

    try { sessionStorage.setItem('yens-internal-home-navigation', String(Date.now())); } catch (_) {}
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initBrandIntro();
  initBrandRefresh();
  initInternalHomeNavigation();
  initSmoothScroll();
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
