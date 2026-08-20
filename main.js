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
function initBrandIntroLegacy() {
  const intro = $('[data-brand-intro]');
  if (!intro) return;

  const surface = $('.signature-intro__surface', intro);
  const introWordmark = $('.signature-intro__wordmark', intro);
  const y = $('.signature-intro__letter--y', intro);
  const e = $('.signature-intro__letter--e', intro);
  const n = $('.signature-intro__letter--n', intro);
  const s = $('.signature-intro__letter--s', intro);
  const yArchitectural = $('.signature-intro__y-part--architectural', y);
  const yOrganic = $('.signature-intro__y-part--organic', y);
  const yStem = $('.signature-intro__y-part--stem', y);
  const guideLines = $$('.signature-intro__guides span', intro);
  const headerBrand = $('.nav .brand');
  const headerWordmark = $('.nav .brand__image');
  const navInner = $('.nav__inner');
  const heroLabel = $('.hero__eyebrow');
  const heroTitle = $('.hero__title');
  const heroCopy = [$('.hero__desc'), $('.hero__actions'), $('.hero__note')].filter(Boolean);
  const heroMedia = $('.hero__media');

  const easing = Object.freeze({
    arrival: 'cubic-bezier(0.16, 0.82, 0.30, 0.96)',
    lock: 'cubic-bezier(0.20, 0.55, 0.35, 0.95)',
    compression: 'cubic-bezier(0.65, 0, 0.35, 1)',
    settle: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    handoff: 'cubic-bezier(0.22, 1, 0.36, 1)'
  });
  const labels = Object.freeze({
    arrival: 150,
    lock: 1150,
    arrivalEnd: 1260,
    compression: 1500,
    lockEnd: 1450,
    symbolLock: 2750,
    symbolSettled: 2820,
    heroHandoff: 3050,
    sharedMotion: 3090,
    headerReveal: 3910,
    symbolArrival: 4140,
    surfaceClear: 4160,
    complete: 4200
  });
  let activeAnimations = [];
  let isPlaying = false;

  const transformTo = (rect, x, yPosition, scale = 1) => {
    const dx = x - (rect.left + rect.width / 2);
    const dy = yPosition - (rect.top + rect.height / 2);
    return 'translate3d(' + dx + 'px, ' + dy + 'px, 0) scale(' + scale + ')';
  };
  const at = (milliseconds) => milliseconds / labels.complete;
  const cancelActiveAnimations = () => {
    activeAnimations.forEach((animation) => animation.cancel());
    activeAnimations = [];
  };
  const restoreSharedSymbol = () => {
    if (y.parentElement !== introWordmark) introWordmark.prepend(y);
    y.classList.remove('brand__shared-y');
    headerBrand?.classList.remove('has-shared-y');
  };
  const lockSharedSymbolInHeader = () => {
    if (!headerBrand) return;
    headerBrand.append(y);
    y.classList.add('brand__shared-y');
    headerBrand.classList.add('has-shared-y');
  };

  const play = () => {
    if (reduceMotion || isPlaying) return;
    isPlaying = true;
    cancelActiveAnimations();
    restoreSharedSymbol();
    document.documentElement.classList.remove('intro-seen');
    document.body.classList.add('intro-active');
    intro.style.visibility = 'visible';

    window.requestAnimationFrame(() => {
      const startTime = document.timeline.currentTime;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const yRect = y.getBoundingClientRect();
      const symbolWidth = Math.min(104, Math.max(74, window.innerWidth * .092));
      const symbolScale = symbolWidth / yRect.width;
      const symbolTransform = transformTo(yRect, centerX, centerY, symbolScale);
      const symbolApproach = transformTo(yRect, centerX, centerY + 1, symbolScale);
      // Meet de echte finale CSS-box in de header. Dit voorkomt afrondingsverschillen
      // tussen de SVG-viewBox, responsieve brandbreedte en browser-subpixels.
      const headerProbe = y.cloneNode(true);
      headerProbe.classList.add('brand__shared-y');
      headerProbe.style.visibility = 'hidden';
      headerProbe.style.opacity = '0';
      headerBrand.append(headerProbe);
      const headerSymbolRect = headerProbe.getBoundingClientRect();
      headerProbe.remove();
      const headerX = headerSymbolRect.left + headerSymbolRect.width / 2;
      const headerY = headerSymbolRect.top + headerSymbolRect.height / 2;
      const headerScale = headerSymbolRect.width / yRect.width;
      const headerOpacity = document.documentElement.hasAttribute('data-theme') ? .78 : .72;
      const headerTransform = transformTo(yRect, headerX, headerY, headerScale);
      const animations = [];
      const addTrack = (target, keyframes) => {
        const animation = target.animate(keyframes, {
          duration: labels.complete,
          easing: 'linear',
          fill: 'both'
        });
        animations.push(animation);
        return animation;
      };

      const yKeyframes = [
        { offset: 0, opacity: 0, transform: 'translate3d(0, 0, 0)' },
        { offset: at(labels.arrival), opacity: 0, transform: 'translate3d(0, 0, 0)', easing: easing.arrival },
        { offset: at(470), opacity: 1, transform: 'translate3d(0, 0, 0)', easing: easing.arrival },
        { offset: at(1125), opacity: 1, transform: 'translate3d(-2px, 0, 0)', easing: easing.lock },
        { offset: at(1190), opacity: 1, transform: 'translate3d(1px, 0, 0)', easing: easing.lock },
        { offset: at(labels.arrivalEnd), opacity: 1, transform: 'translate3d(0, 0, 0)', easing: easing.lock },
        { offset: at(labels.lockEnd), opacity: 1, transform: 'translate3d(-1px, 0, 0)', easing: easing.compression },
        { offset: at(labels.symbolLock), opacity: 1, transform: symbolApproach, easing: easing.settle },
        { offset: at(labels.symbolSettled), opacity: 1, transform: symbolTransform, easing: easing.settle },
        { offset: at(labels.sharedMotion), opacity: 1, transform: symbolTransform, easing: 'linear' }
      ];
      const handoffDuration = labels.symbolArrival - labels.sharedMotion;
      const handoffX = headerX - centerX;
      const handoffY = headerY - centerY;
      const control1 = {
        x: centerX + handoffX * .16 + Math.min(16, window.innerWidth * .01),
        y: centerY + handoffY * .08
      };
      const control2 = {
        x: centerX + handoffX * .88 + Math.min(3, window.innerWidth * .002),
        y: centerY + handoffY * .88 - Math.min(3, window.innerHeight * .003)
      };
      const handoffSamples = 72;
      for (let index = 1; index <= handoffSamples; index += 1) {
        const timeProgress = index / handoffSamples;
        // Smootherstep geeft nul snelheid én nul versnelling op de landing,
        // waardoor de laatste subpixels zonder mechanische correctie uitlopen.
        const motionProgress = timeProgress ** 3
          * (timeProgress * (timeProgress * 6 - 15) + 10);
        const inverse = 1 - motionProgress;
        const xPosition = inverse ** 3 * centerX
          + 3 * inverse ** 2 * motionProgress * control1.x
          + 3 * inverse * motionProgress ** 2 * control2.x
          + motionProgress ** 3 * headerX;
        const yPosition = inverse ** 3 * centerY
          + 3 * inverse ** 2 * motionProgress * control1.y
          + 3 * inverse * motionProgress ** 2 * control2.y
          + motionProgress ** 3 * headerY;
        const scale = symbolScale + (headerScale - symbolScale) * motionProgress;
        yKeyframes.push({
          offset: at(labels.sharedMotion + handoffDuration * timeProgress),
          opacity: 1,
          transform: transformTo(yRect, xPosition, yPosition, scale),
          easing: 'linear'
        });
      }
      yKeyframes.push({ offset: 1, opacity: 1, transform: headerTransform });
      addTrack(y, yKeyframes);
      addTrack(y, [
        { offset: 0, clipPath: 'inset(49% 46% 49% 46%)' },
        { offset: at(labels.arrival), clipPath: 'inset(49% 46% 49% 46%)', easing: easing.arrival },
        { offset: at(470), clipPath: 'inset(0 0 0 0)', easing: easing.arrival },
        { offset: 1, clipPath: 'inset(0 0 0 0)' }
      ]);

      const letterTracks = [
        { target: e, from: '-18vw', stagger: 0, overshoot: 7, compression: 1530 },
        { target: n, from: '15vw', stagger: 50, overshoot: -8, compression: 1490 },
        { target: s, from: '23vw', stagger: 100, overshoot: -10, compression: 1450 }
      ];
      letterTracks.forEach(({ target, from, stagger, overshoot, compression }) => {
        const rect = target.getBoundingClientRect();
        const motionStart = 520 + stagger;
        const impact = 1130 + stagger * .55;
        addTrack(target, [
          { offset: 0, transform: 'translate3d(' + from + ', 0, 0)', easing: easing.arrival },
          { offset: at(motionStart), transform: 'translate3d(' + from + ', 0, 0)', easing: easing.arrival },
          { offset: at(impact), transform: 'translate3d(' + overshoot + 'px, 0, 0)', easing: easing.lock },
          { offset: at(impact + 125), transform: 'translate3d(' + (overshoot * -.18) + 'px, 0, 0)', easing: easing.lock },
          { offset: at(compression), transform: 'translate3d(' + (overshoot * -.08) + 'px, 0, 0)', easing: easing.compression },
          { offset: at(labels.symbolLock), transform: transformTo(rect, centerX, centerY, .94), easing: easing.compression },
          { offset: 1, transform: transformTo(rect, centerX, centerY, .94) }
        ]);
        addTrack(target, [
          { offset: 0, opacity: 0 },
          { offset: at(motionStart - 1), opacity: 0 },
          { offset: at(motionStart), opacity: .18, easing: easing.arrival },
          { offset: at(impact - 140), opacity: .84, easing: easing.arrival },
          { offset: at(impact), opacity: 1 },
          { offset: at(2580), opacity: 1, easing: easing.compression },
          { offset: at(labels.symbolLock), opacity: 0 },
          { offset: 1, opacity: 0 }
        ]);
        addTrack(target, [
          { offset: 0, clipPath: 'inset(0 0 0 0)' },
          { offset: at(compression + (labels.symbolLock - compression) * .72), clipPath: 'inset(0 0 0 0)', easing: easing.compression },
          { offset: at(compression + (labels.symbolLock - compression) * .88), clipPath: 'inset(38% 8% 38% 8%)', easing: easing.compression },
          { offset: at(labels.symbolLock), clipPath: 'inset(49% 49% 49% 49%)' },
          { offset: 1, clipPath: 'inset(49% 49% 49% 49%)' }
        ]);
      });

      guideLines.forEach((line, index) => {
        const direction = index === 0 ? '-16vw' : '16vw';
        addTrack(line, [
          { offset: 0, opacity: .025, transform: 'translateX(' + direction + ') scaleX(.18)', easing: easing.arrival },
          { offset: at(labels.arrival + index * 50), opacity: .025, transform: 'translateX(' + direction + ') scaleX(.18)', easing: easing.arrival },
          { offset: at(1260), opacity: .09, transform: 'translateX(0) scaleX(1)', easing: easing.lock },
          { offset: at(1450), opacity: .075, transform: 'translateX(0) scaleX(.97)', easing: easing.compression },
          { offset: at(labels.symbolLock), opacity: 0, transform: 'translateX(0) scaleX(0)', easing: easing.compression },
          { offset: 1, opacity: 0, transform: 'translateX(0) scaleX(0)' }
        ]);
      });

      [
        { target: yArchitectural, start: 2750, end: 2780, from: 'translate3d(.8px, 0, 0)' },
        { target: yStem, start: 2770, end: 2800, from: 'translate3d(0, 1px, 0)' },
        { target: yOrganic, start: 2790, end: 2820, from: 'translate3d(-.8px, 0, 0)' }
      ].forEach(({ target, start, end, from }) => {
        addTrack(target, [
          { offset: 0, transform: 'translate3d(0, 0, 0)' },
          { offset: at(start - 60), transform: 'translate3d(0, 0, 0)', easing: easing.compression },
          { offset: at(start), transform: from, easing: easing.settle },
          { offset: at(end), transform: 'translate3d(0, 0, 0)', easing: easing.settle },
          { offset: 1, transform: 'translate3d(0, 0, 0)' }
        ]);
      });

      addTrack(surface, [
        { offset: 0, opacity: 1 },
        { offset: at(labels.heroHandoff), opacity: 1, easing: easing.handoff },
        { offset: at(labels.surfaceClear), opacity: 0, easing: easing.handoff },
        { offset: 1, opacity: 0 }
      ]);

      const heroTracks = [
        { targets: [navInner], start: 3120 },
        { targets: [heroLabel], start: 3185 },
        { targets: [heroTitle], start: 3250 },
        { targets: heroCopy, start: 3315 },
        { targets: [heroMedia], start: 3380 }
      ];
      heroTracks.forEach(({ targets, start }) => {
        targets.filter(Boolean).forEach((target) => {
          addTrack(target, [
            { offset: 0, opacity: 0 },
            { offset: at(start), opacity: 0, easing: easing.handoff },
            { offset: at(start + 520), opacity: 1, easing: easing.handoff },
            { offset: 1, opacity: 1 }
          ]);
        });
      });

      addTrack(headerWordmark, [
        { offset: 0, opacity: 0, clipPath: 'inset(0 0 0 100%)' },
        { offset: at(labels.headerReveal), opacity: 0, clipPath: 'inset(0 0 0 100%)', easing: easing.handoff },
        { offset: at(labels.symbolArrival), opacity: headerOpacity, clipPath: 'inset(0 0 0 35.48%)', easing: easing.handoff },
        { offset: 1, opacity: headerOpacity, clipPath: 'inset(0 0 0 35.48%)' }
      ]);

      const masterClock = addTrack(intro, [
        { offset: 0, opacity: 1 },
        { offset: 1, opacity: 1 }
      ]);
      animations.forEach((animation) => { animation.startTime = startTime; });
      activeAnimations = animations;
      masterClock.finished.then(() => {
        // Behoud exact hetzelfde SVG-element na de landing. Zo is er geen
        // frame waarin het geanimeerde symbool wordt verwisseld voor de Y in
        // de headerafbeelding (die wissel veroorzaakte de zichtbare naschuif).
        lockSharedSymbolInHeader();
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
   Merkintro — spatial signature / één gedeelde mastertimeline
   -------------------------------------------------------------------------- */
function initBrandIntro() {
  const intro = $('[data-brand-intro]');
  if (!intro) return;

  const duration = 3900;
  const t = (ms) => ms / duration;
  const surface = $('.signature-intro__surface', intro);
  const wordmark = $('.signature-intro__wordmark', intro);
  const y = $('.signature-intro__letter--y', intro);
  const letters = [
    $('.signature-intro__letter--e', intro),
    $('.signature-intro__letter--n', intro),
    $('.signature-intro__letter--s', intro)
  ];
  const yParts = [
    $('.signature-intro__y-part--architectural', y),
    $('.signature-intro__y-part--stem', y),
    $('.signature-intro__y-part--organic', y)
  ];
  const guides = $$('.signature-intro__guides span', intro);
  const headerBrand = $('.nav .brand');
  const headerImage = $('.nav .brand__image');
  const heroGroups = [
    { target: $('.nav__inner'), start: 2780 },
    { target: $('.hero__eyebrow'), start: 2860 },
    { target: $('.hero__title'), start: 2940 },
    { target: $('.hero__desc'), start: 3020 },
    { target: $('.hero__actions'), start: 3085 },
    { target: $('.hero__media'), start: 3150 }
  ];
  const ease = {
    form: 'cubic-bezier(.16, 1, .30, 1)',
    gather: 'cubic-bezier(.55, .02, .35, 1)',
    release: 'cubic-bezier(.22, 1, .36, 1)'
  };
  let running = false;
  let active = [];

  const cancel = () => {
    active.forEach((animation) => animation.cancel());
    active = [];
  };
  const moveTo = (rect, x, yPosition, scale = 1) => {
    const dx = x - rect.left - rect.width / 2;
    const dy = yPosition - rect.top - rect.height / 2;
    return `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
  };
  const restoreY = () => {
    if (y.parentElement !== wordmark) wordmark.prepend(y);
    y.classList.remove('brand__shared-y');
    headerBrand?.classList.remove('has-shared-y');
  };
  const placeYInHeader = () => {
    if (!headerBrand) return;
    headerBrand.append(y);
    y.classList.add('brand__shared-y');
    headerBrand.classList.add('has-shared-y');
  };

  const play = () => {
    if (reduceMotion || running || !headerBrand || !headerImage) return;
    running = true;
    cancel();
    restoreY();
    document.documentElement.classList.remove('intro-seen');
    document.body.classList.add('intro-active');
    intro.style.visibility = 'visible';

    requestAnimationFrame(() => {
      const centerX = innerWidth / 2;
      const centerY = innerHeight / 2;
      const yRect = y.getBoundingClientRect();
      const centralWidth = Math.min(108, Math.max(78, innerWidth * .09));
      const centralScale = centralWidth / yRect.width;
      const centralY = moveTo(yRect, centerX, centerY, centralScale);

      const probe = y.cloneNode(true);
      probe.classList.add('brand__shared-y');
      probe.style.cssText = 'visibility:hidden;opacity:0';
      headerBrand.append(probe);
      const targetRect = probe.getBoundingClientRect();
      probe.remove();
      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;
      const targetScale = targetRect.width / yRect.width;
      const targetTransform = moveTo(yRect, targetX, targetY, targetScale);
      const headerOpacity = document.documentElement.hasAttribute('data-theme') ? .78 : .72;
      const tracks = [];
      const animate = (target, keyframes) => {
        if (!target) return null;
        const animation = target.animate(keyframes, {
          duration,
          easing: 'linear',
          fill: 'both'
        });
        tracks.push(animation);
        return animation;
      };

      const yFrames = [
        { offset: 0, opacity: 0, transform: centralY },
        { offset: t(220), opacity: 0, transform: centralY, easing: ease.form },
        { offset: t(680), opacity: 1, transform: centralY, easing: ease.release },
        { offset: t(780), opacity: 1, transform: centralY, easing: ease.release },
        { offset: t(1340), opacity: 1, transform: 'translate3d(0,0,0) scale(1)', easing: ease.form },
        { offset: t(1720), opacity: 1, transform: 'translate3d(0,0,0) scale(1)', easing: ease.gather },
        { offset: t(2500), opacity: 1, transform: centralY, easing: ease.release },
        { offset: t(2720), opacity: 1, transform: centralY }
      ];

      const travel = { x: targetX - centerX, y: targetY - centerY };
      const c1 = { x: centerX + travel.x * .18 + Math.min(12, innerWidth * .008), y: centerY + travel.y * .08 };
      const c2 = { x: centerX + travel.x * .88 + Math.min(3, innerWidth * .002), y: centerY + travel.y * .88 - Math.min(3, innerHeight * .003) };
      const samples = 84;
      for (let i = 1; i <= samples; i += 1) {
        const p = i / samples;
        const q = p ** 3 * (p * (p * 6 - 15) + 10);
        const inverse = 1 - q;
        const xPosition = inverse ** 3 * centerX + 3 * inverse ** 2 * q * c1.x + 3 * inverse * q ** 2 * c2.x + q ** 3 * targetX;
        const yPosition = inverse ** 3 * centerY + 3 * inverse ** 2 * q * c1.y + 3 * inverse * q ** 2 * c2.y + q ** 3 * targetY;
        const scale = centralScale + (targetScale - centralScale) * q;
        yFrames.push({
          offset: t(2720 + (3820 - 2720) * p),
          opacity: 1,
          transform: moveTo(yRect, xPosition, yPosition, scale),
          easing: 'linear'
        });
      }
      yFrames.push({ offset: 1, opacity: 1, transform: targetTransform });
      animate(y, yFrames);

      yParts.forEach((part, index) => {
        const starts = [230, 330, 270];
        const ends = [560, 680, 610];
        const vectors = ['translate3d(-1px,0,0)', 'translate3d(0,1px,0)', 'translate3d(1px,0,0)'];
        animate(part, [
          { offset: 0, opacity: 0, transform: vectors[index] },
          { offset: t(starts[index]), opacity: 0, transform: vectors[index], easing: ease.form },
          { offset: t(ends[index]), opacity: 1, transform: 'translate3d(0,0,0)', easing: ease.form },
          { offset: 1, opacity: 1, transform: 'translate3d(0,0,0)' }
        ]);
      });

      const assembly = [
        { start: 700, settle: 1240, close: 1820 },
        { start: 780, settle: 1320, close: 1760 },
        { start: 860, settle: 1400, close: 1700 }
      ];
      letters.forEach((letter, index) => {
        const rect = letter.getBoundingClientRect();
        const collapse = moveTo(rect, centerX, centerY, .94);
        const spec = assembly[index];
        const closedClip = [
          'inset(0 100% 0 0)',
          'inset(49% 0 49% 0)',
          'inset(0 0 0 100%)'
        ][index];
        animate(letter, [
          { offset: 0, opacity: 0, transform: collapse, clipPath: closedClip },
          { offset: t(spec.start), opacity: 0, transform: collapse, clipPath: closedClip, easing: ease.form },
          { offset: t(spec.start + 35), opacity: 1, transform: collapse, clipPath: closedClip, easing: ease.form },
          { offset: t(spec.settle), opacity: 1, transform: 'translate3d(0,0,0)', clipPath: 'inset(0 0 0 0)', easing: ease.form },
          { offset: t(1650), opacity: 1, transform: 'translate3d(0,0,0)', clipPath: 'inset(0 0 0 0)', easing: ease.gather },
          { offset: t(spec.close), opacity: 1, transform: 'translate3d(0,0,0)', clipPath: 'inset(0 0 0 0)', easing: ease.gather },
          { offset: t(2390 + index * 30), opacity: 1, transform: collapse, clipPath: 'inset(43% 0 43% 0)', easing: ease.gather },
          { offset: t(2500), opacity: 0, transform: collapse, clipPath: 'inset(46% 49% 46% 49%)', easing: ease.release },
          { offset: 1, opacity: 0, transform: collapse, clipPath: 'inset(46% 49% 46% 49%)' }
        ]);
      });

      guides.forEach((guide, index) => animate(guide, [
        { offset: 0, opacity: 0, transform: 'translateX(0) scaleX(0)' },
        { offset: t(100 + index * 55), opacity: 0, transform: 'translateX(0) scaleX(0)', easing: ease.form },
        { offset: t(560), opacity: .065, transform: 'translateX(0) scaleX(.78)', easing: ease.form },
        { offset: t(1650), opacity: .065, transform: 'translateX(0) scaleX(.78)', easing: ease.gather },
        { offset: t(2500), opacity: 0, transform: 'translateX(0) scaleX(.04)', easing: ease.gather },
        { offset: 1, opacity: 0, transform: 'translateX(0) scaleX(0)' }
      ]));

      animate(surface, [
        { offset: 0, opacity: 1 },
        { offset: t(2700), opacity: 1, easing: ease.release },
        { offset: t(3860), opacity: 0 },
        { offset: 1, opacity: 0 }
      ]);
      heroGroups.forEach(({ target, start }) => animate(target, [
        { offset: 0, opacity: 0 },
        { offset: t(start), opacity: 0, easing: ease.release },
        { offset: t(start + 460), opacity: 1 },
        { offset: 1, opacity: 1 }
      ]));
      animate(headerImage, [
        { offset: 0, opacity: 0, clipPath: 'inset(0 0 0 100%)' },
        { offset: t(3590), opacity: 0, clipPath: 'inset(0 0 0 100%)', easing: ease.release },
        { offset: t(3820), opacity: headerOpacity, clipPath: 'inset(0 0 0 35.48%)' },
        { offset: 1, opacity: headerOpacity, clipPath: 'inset(0 0 0 35.48%)' }
      ]);

      const clock = animate(intro, [{ offset: 0, opacity: 1 }, { offset: 1, opacity: 1 }]);
      const startTime = document.timeline.currentTime;
      tracks.forEach((animation) => { animation.startTime = startTime; });
      active = tracks;
      clock.finished.then(() => {
        placeYInHeader();
        intro.style.visibility = 'hidden';
        document.body.classList.remove('intro-active');
        document.documentElement.classList.add('intro-seen');
        cancel();
        running = false;
        try { sessionStorage.setItem('yens-brand-intro-v7', '1'); } catch (_) {}
      });
    });
  };

  headerBrand.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'auto' });
    play();
  });

  let seen = false;
  const preview = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  try { seen = !preview && sessionStorage.getItem('yens-brand-intro-v7') === '1'; } catch (_) {}
  if (reduceMotion || seen) {
    intro.style.visibility = 'hidden';
    document.body.classList.remove('intro-active');
  } else {
    requestAnimationFrame(play);
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
