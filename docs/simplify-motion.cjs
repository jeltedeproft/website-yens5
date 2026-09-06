const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

const mainFile = path.join(root, 'main.js');
let js = fs.readFileSync(mainFile, 'utf8');

const introStart = js.indexOf('function initBrandIntro()');
const refreshStart = js.indexOf('function initBrandRefresh()', introStart);
const internalStart = js.indexOf('function initInternalHomeNavigation()', refreshStart);
const transitionStart = js.indexOf('function initSelfPageTransition()', internalStart);
const domReadyStart = js.indexOf("document.addEventListener('DOMContentLoaded'", transitionStart);
if ([introStart, refreshStart, internalStart, transitionStart, domReadyStart].some(index => index < 0)) {
  throw new Error('Motion functions not found');
}

const intro = `function initBrandIntro() {
  const intro = $('[data-brand-intro]');
  if (!intro) return;

  const finish = () => {
    document.body.classList.add('intro-complete', 'is-loaded', 'hero-intro-complete');
    document.body.classList.remove('brand-intro-active');
    intro.hidden = true;
  };

  const shouldPlay = window.yensBrandIntroShouldPlay === true;
  if (!shouldPlay || reduceMotion || !intro.animate) {
    finish();
    return;
  }

  try { sessionStorage.setItem('yens-intro-seen', '1'); } catch (_) {}
  document.body.classList.add('intro-complete');

  const lockup = $('.brand-intro__lockup', intro);
  const planes = $('.brand-intro__planes', intro);
  const animations = [];
  if (lockup) {
    animations.push(lockup.animate([
      { opacity: 0, transform: 'translate3d(0, 8px, 0)' },
      { offset: .25, opacity: 0, transform: 'translate3d(0, 8px, 0)' },
      { offset: .62, opacity: 1, transform: 'translate3d(0, 0, 0)' },
      { offset: .78, opacity: 1, transform: 'translate3d(0, 0, 0)' },
      { opacity: 0, transform: 'translate3d(0, -3px, 0)' }
    ], { duration: 1000, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' }));
  }
  if (planes) {
    animations.push(planes.animate([
      { opacity: 1 },
      { offset: .72, opacity: 1 },
      { opacity: 0 }
    ], { duration: 1000, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' }));
  }
  const clock = intro.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 1000 });
  animations.push(clock);
  clock.finished.then(finish).catch(finish);
}

`;

// Behoud de interne Home-markering, maar laat het logo als gewone link functioneren.
const internalFunction = js.slice(internalStart, transitionStart);
js = js.slice(0, introStart) + intro + internalFunction + js.slice(domReadyStart);
js = js.replace('  initBrandRefresh();\n', '');
js = js.replace('  initSelfPageTransition();\n', '');
fs.writeFileSync(mainFile, js);

const indexFile = path.join(root, 'index.html');
let html = fs.readFileSync(indexFile, 'utf8');
html = html.replace(/    let yensReplayRequested = false;\r?\n/, '');
html = html.replace(/      yensReplayRequested = sessionStorage\.getItem\('yens-intro-replay'\) === '1';\r?\n/, '');
html = html.replace(/    const yensNavigationType = performance\.getEntriesByType\('navigation'\)\[0\]\?\.type;\r?\n/, '');
html = html.replace(/    window\.yensBrandIntroShouldPlay = yensReplayRequested\r?\n      \|\| \(!yensInternalHomeNavigation && !yensIntroSeen\);/, '    window.yensBrandIntroShouldPlay = !yensInternalHomeNavigation && !yensIntroSeen;');
fs.writeFileSync(indexFile, html);

const cssFile = path.join(root, 'style.css');
let css = fs.readFileSync(cssFile, 'utf8');
const cssStart = css.indexOf('/* Self transition — dezelfde pagina duwt zichzelf verticaal uit beeld. */');
const cssEndMarker = '/* Aanbodkeuze — heldere, rustig scanbare kaartopbouw. */';
const cssEnd = css.indexOf(cssEndMarker, cssStart);
if (cssStart >= 0 && cssEnd > cssStart) css = css.slice(0, cssStart) + css.slice(cssEnd);
fs.writeFileSync(cssFile, css);

console.log('Merkintro ingekort tot 1000 ms; logo en actieve navigatielinks zijn directe links.');
