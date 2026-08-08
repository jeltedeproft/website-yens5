/* ==========================================================================
   YENS — interactie & subtiel bewegingsontwerp
   ========================================================================== */

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
const INTRO_SESSION_KEY = 'yensIntroPlayed';

function setIntroPlayed(hasPlayed) {
  try {
    if (hasPlayed) sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
    else sessionStorage.removeItem(INTRO_SESSION_KEY);
  } catch (_) {
    /* De website en intro blijven bruikbaar wanneer sessionStorage niet beschikbaar is. */
  }
}

function initIntroNavigation() {
  const replayLogo = $('.nav .brand');

  if (replayLogo) {
    replayLogo.setAttribute('aria-label', 'YENS-intro opnieuw bekijken en naar home');
    replayLogo.addEventListener('click', () => setIntroPlayed(false));
  }

  $$('a[href="/"]:not(.brand)').forEach((homeLink) => {
    homeLink.addEventListener('click', () => setIntroPlayed(true));
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
   Intro-overlay
   -------------------------------------------------------------------------- */
function initLoader() {
  const loader = $('#loader');
  const reveal = () => document.body.classList.add('is-loaded');

  if (!loader) {
    reveal();
    return;
  }
  if (document.documentElement.classList.contains('intro-skip')) {
    loader.classList.add('is-hidden');
    reveal();
    return;
  }
  if (reduceMotion) {
    loader.classList.add('is-hidden');
    setIntroPlayed(true);
    reveal();
    return;
  }

  window.setTimeout(() => {
    loader.classList.add('is-exiting');
    reveal();

    window.setTimeout(() => {
      loader.classList.add('is-hidden');
      setIntroPlayed(true);
    }, 1100);
  }, 3600);
}

/* --------------------------------------------------------------------------
   Navigatie: scrollstatus + mobiel menu
   -------------------------------------------------------------------------- */
function initNav() {
  const nav = $('#nav');
  const burger = $('#nav-burger');
  const panel = $('#nav-mobile');

  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (!burger || !panel) return;

  const setOpen = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    panel.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
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
      const dot = $('.step__dot', step);
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
  if (!items.length || reduceMotion) return;

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
   Kleine details
   -------------------------------------------------------------------------- */
function initMisc() {
  $$('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initIntroNavigation();
  initLoader();
  initNav();
  initReveal();
  initProcess();
  initParallax();
  initFaq();
  initStickyCta();
  initFilters();
  initForm();
  initMisc();
});
