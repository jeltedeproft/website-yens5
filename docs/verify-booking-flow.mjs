import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { initBooking } from '../booking-flow.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const initFormCode = main.slice(main.indexOf('function initForm()'), main.indexOf('function initPartnerMarquee()'));

function fixture(search = '', responseOk = true) {
  const nodes = new Map();
  const inputs = [];
  const formEvents = {};
  const requests = [];
  const wrapper = () => ({ error: null, invalid: false, classList: { add() {}, remove() {} }, querySelector() { return this.error; }, appendChild(error) { this.error = error; error.remove = () => { this.error = null; }; } });
  const group = wrapper();
  function node(id, props = {}) {
    const wrap = props.name === 'afspraak' ? group : wrapper();
    const n = { value: '', textContent: '', hidden: false, checked: false, disabled: false, required: false, type: 'text', handlers: {}, attributes: {}, ...props,
      classList: { add() {}, remove() {} }, closest: () => wrap,
      addEventListener(type, handler) { this.handlers[type] = handler; },
      removeAttribute(name) { delete this.attributes[name]; }, setAttribute(name, value) { this.attributes[name] = value; }, focus() {},
    };
    if (n.name) inputs.push(n);
    if (id) nodes.set('#' + id, n);
    return n;
  }
  const choices = ['eerste-training', 'gratis-kennismaking'].map(value => node('', { name: 'afspraak', type: 'radio', value, required: true }));
  node('booking-summary'); node('booking-description'); node('telephone-required');
  node('telefoon', { name: 'telefoon', type: 'tel' });
  node('naam', { name: 'naam', required: true, value: 'Test' });
  node('email', { name: 'email', type: 'email', required: true, value: 'test@example.com' });
  node('doel', { name: 'doel', required: true, value: 'Sterker worden' });
  node('privacy', { name: 'privacy', type: 'checkbox', required: true, checked: true, value: 'on' });
  node('', { name: 'website' }); node('', { name: 'form-name', value: 'kennismaking' });
  for (const name of ['afspraak_type', 'afspraak_duur', 'afspraak_prijs']) node('', { name });
  for (const name of ['begeleiding', 'locatie']) node(name, { name, options: [{ value: 'duo-training' }, { value: 'ranst' }] });
  const submit = node('submit', { type: 'submit' });
  const status = node('form-status', { hidden: true });
  const form = {
    querySelector(selector) {
      if (nodes.has(selector)) return nodes.get(selector);
      if (selector === '[type="submit"]') return submit;
      if (selector.startsWith('.field--error')) return inputs.find(n => n.closest().error);
      const name = selector.match(/^\[name=["']?([^"'\]]+)["']?\]$/)?.[1];
      return inputs.find(n => n.name === name) || null;
    },
    querySelectorAll(selector) {
      if (selector === '[required]') return inputs.filter(n => n.required);
      if (/afspraak|input\[type=radio\]/.test(selector)) return choices;
      return [];
    },
    addEventListener(type, handler) { formEvents[type] = handler; },
    reset() { inputs.forEach(n => { if (n.type === 'radio' || n.type === 'checkbox') n.checked = false; else n.value = ''; }); }
  };
  const context = { initBooking: form => initBooking(form, search), URLSearchParams, CONTACT_WHATSAPP: '+32 499 00 74 86', FORM_ACTION: '/',
    window: { location: { search } },
    document: { createElement: () => ({}) },
    $: selector => selector === '#contact-form' ? form : status,
    $$: (selector, target) => target.querySelectorAll(selector),
    FormData: class { constructor(form) { this.data = inputs.filter(n => !n.disabled && (!['radio', 'checkbox'].includes(n.type) || n.checked)).map(n => [n.name, n.value]); } [Symbol.iterator]() { return this.data[Symbol.iterator](); } },
    fetch: async (url, options) => { requests.push(new URLSearchParams(options.body)); return { ok: responseOk, status: responseOk ? 200 : 500 }; }
  };
  vm.runInNewContext(initFormCode + '\ninitForm();', context);
  return { form, inputs, choices, nodes, status, requests, submit,
    choose(value) { choices.forEach(n => { n.checked = n.value === value; }); const choice = choices.find(n => n.checked); choice.handlers.change(); formEvents.change({ target: choice }); },
    send: () => formEvents.submit({ preventDefault() {} })
  };
}

for (const [route, label, duration, price] of [['eerste-training', 'Eerste training', '60 minuten', '€65'], ['gratis-kennismaking', 'Gratis kennismaking', '15 minuten', '€0']]) {
  const f = fixture(`?afspraak=${route}&begeleiding=duo-training&locatie=ranst`);
  assert.equal(f.choices.find(n => n.checked).value, route);
  assert.ok(f.nodes.get('#booking-summary').textContent.includes(`${label} · ${duration.split(' ')[0]} min · ${price}`));
  assert.equal(f.nodes.get('#begeleiding').value, 'duo-training');
  assert.equal(f.nodes.get('#locatie').value, 'ranst');
  if (route === 'gratis-kennismaking') {
    await f.send(); assert.equal(f.requests.length, 0, 'Phone required for telephone appointment');
    f.nodes.get('#telefoon').value = '+32499007486';
  }
  await f.send();
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].get('afspraak'), route);
  assert.equal(f.requests[0].get('afspraak_type'), label);
  assert.equal(f.requests[0].get('afspraak_duur'), duration);
  assert.equal(f.requests[0].get('afspraak_prijs'), price);
  assert.ok(f.status.textContent.includes(`${label} · ${duration.split(' ')[0]} min · ${price}`));
  assert.equal(f.choices.find(n => n.checked).value, route, 'Selection survives successful reset');
  assert.equal(f.submit.disabled, false);
  assert.ok(f.choices.every(n => !n.disabled));
}
for (const query of ['', '?afspraak=invalid', '?afspraak=__proto__']) {
  const f = fixture(query); await f.send(); assert.equal(f.requests.length, 0, 'Missing/invalid choice cannot submit');
}
const switched = fixture('?afspraak=gratis-kennismaking');
switched.choose('eerste-training');
assert.equal(switched.nodes.get('#telefoon').required, false);
await switched.send(); assert.equal(switched.requests[0].get('afspraak_prijs'), '€65');
const failed = fixture('?afspraak=eerste-training', false);
await failed.send(); assert.ok(failed.status.textContent.includes('WhatsApp')); assert.equal(failed.nodes.get('#naam').value, 'Test');
assert.equal(failed.submit.disabled, false);
assert.ok(failed.choices.every(n => !n.disabled));

const offer = fs.readFileSync(path.join(root, 'begeleiding.html'), 'utf8');
for (const required of ['€816', '€68', '€504', '€42', '€408', '€34', '€1.560', '€65', '€960', '€40', '€768', '€32', '€272', '€168', '€136', '€520', '€320', '€256', '€72', '€45', '€36', '€912', '€76', '€552', '€46', '€432', '€304', '€184', '€144', '€80', '€50', 'maximaal 15 weken', 'maximaal 18 weken', 'maximaal 6 weken', 'maximaal 8 weken']) assert.ok(offer.includes(required), 'Required price/term: ' + required);
for (const name of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  assert.ok(!/€60\b|€260\b|€780\b|€160\b|€480\b|€128\b|€384\b|€70\b|eerste afspraak|dertig minuten|14 kalenderdagen/i.test(html), 'Stale content in ' + name);
  for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const url = match[1].replaceAll('&amp;', '&');
    if (/Plan je eerste training/.test(match[2])) assert.ok(url.includes('afspraak=eerste-training'));
    if (/Plan een gratis kennismaking/.test(match[2])) assert.ok(url.includes('afspraak=gratis-kennismaking'));
    if (/^(https?:|mailto:|tel:)/.test(url)) continue;
    const [page, fragment] = url.split('#');
    const target = page ? path.join(root, page.split('?')[0].replace(/^\//, '') || 'index.html') : path.join(root, name);
    assert.ok(fs.existsSync(target), `${name}: missing ${url}`);
    if (fragment) assert.ok(fs.readFileSync(target, 'utf8').includes(`id="${fragment}"`), `${name}: missing anchor ${url}`);
  }
}
console.log('PASS: both routes, query preselection, switching, validation, submission payload, success/error states, prices, terms, CTA destinations and internal anchors. Network mocked; no submissions sent.');
