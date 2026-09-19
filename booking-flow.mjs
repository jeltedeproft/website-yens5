export const APPOINTMENTS = Object.freeze({
  'gratis-kennismaking': Object.freeze({
    label: 'Even kennismaken',
    duration: 15,
    price: 0,
    description: 'Kort telefonisch kennismaken en horen waar je naar op zoek bent.'
  }),
  'eerste-training': Object.freeze({
    label: 'Meteen aan de slag',
    duration: 60,
    price: 65,
    description: 'Intake, bewegingsanalyse en eerste training.'
  })
});

export function appointmentFor(value) {
  return Object.hasOwn(APPOINTMENTS, value) ? APPOINTMENTS[value] : null;
}

export function appointmentSummary(value) {
  const appointment = appointmentFor(value);
  return appointment ? `${appointment.label} · ${appointment.duration} min · €${appointment.price}` : '';
}

export function initBooking(form, search = window.location.search) {
  const choices = [...form.querySelectorAll('[name="afspraak"]')];
  const summary = form.querySelector('#booking-summary');
  const description = form.querySelector('#booking-description');
  const telephone = form.querySelector('#telefoon');
  const email = form.querySelector('#email');
  const telephoneRequired = form.querySelector('#telephone-required');
  const emailRequired = form.querySelector('#email-required');
  const telephoneHint = form.querySelector('#telephone-hint');
  const emailHint = form.querySelector('#email-hint');
  const submit = form.querySelector('[type="submit"]');
  const fields = ['afspraak_type', 'afspraak_duur', 'afspraak_prijs'].map(name => form.querySelector(`[name="${name}"]`));
  const selectedValue = () => choices.find(choice => choice.checked)?.value || '';

  const clearFieldError = (field) => {
    field?.removeAttribute('aria-invalid');
    field?.closest('.field')?.classList.remove('field--error');
    field?.closest('.field')?.querySelector('.field__error')?.remove();
  };

  const sync = () => {
    const value = selectedValue();
    const appointment = appointmentFor(value);
    if (summary) summary.textContent = appointment ? `Geselecteerd: ${appointmentSummary(value)}` : '';
    if (description) description.textContent = appointment?.description || '';
    fields.forEach((field, index) => {
      if (field) field.value = appointment ? [appointment.label, `${appointment.duration} minuten`, `€${appointment.price}`][index] : '';
    });

    const isCall = value === 'gratis-kennismaking';
    const isTraining = value === 'eerste-training';
    if (telephone) telephone.required = isCall;
    if (email) email.required = isTraining;
    if (telephoneRequired) telephoneRequired.hidden = !isCall;
    if (emailRequired) emailRequired.hidden = !isTraining;
    if (telephoneHint) telephoneHint.textContent = isCall ? 'Nodig om je te kunnen bellen.' : 'Mag, als je graag telefonisch afstemt.';
    if (emailHint) emailHint.textContent = isTraining ? 'Nodig voor de praktische bevestiging.' : 'Mag, voor een bevestiging achteraf.';
    if (!isCall) clearFieldError(telephone);
    if (!isTraining) clearFieldError(email);
    if (submit && !submit.hasAttribute('data-static-label')) {
      submit.textContent = appointment ? `Plan mijn ${appointment.label.toLowerCase()}` : 'Plan mijn eerste stap';
    }
  };

  const requested = new URLSearchParams(search).get('afspraak');
  if (appointmentFor(requested)) choices.forEach(choice => { choice.checked = choice.value === requested; });
  choices.forEach(choice => choice.addEventListener('change', sync));
  sync();

  return {
    summary: () => appointmentSummary(selectedValue()),
    resetDetails: sync
  };
}

export function initContactJourney(form) {
  if (!form?.matches('[data-contact-journey]')) return null;

  const steps = [...form.querySelectorAll('[data-journey-step]')];
  const step = number => steps.find(item => item.dataset.journeyStep === String(number));
  const appointmentChoices = [...form.querySelectorAll('[name="afspraak"]')];
  const goalChoices = [...form.querySelectorAll('[name="doelen"]')];
  const locationChoices = [...form.querySelectorAll('[name="locatie"]')];

  const selected = choices => choices.find(choice => choice.checked);
  const selectedGoals = () => goalChoices.filter(choice => choice.checked);

  const gentlyFollow = element => {
    if (!element) return;
    window.setTimeout(() => {
      const top = element.getBoundingClientRect().top;
      const delta = Math.min(Math.max(top - window.innerHeight * .58, 0), 260);
      if (delta > 12) window.scrollBy({ top: delta, behavior: 'smooth' });
    }, 160);
  };

  const showSummary = (target, text) => {
    const summary = target?.querySelector('[data-step-summary]');
    if (!summary) return;
    const copy = document.createElement('span');
    copy.textContent = text;
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Wijzig';
    edit.addEventListener('click', () => {
      steps.forEach(item => item.classList.remove('is-current'));
      target.classList.add('is-current');
      gentlyFollow(target);
    });
    summary.replaceChildren(copy, edit);
  };

  const reveal = (target, { current = true, follow = true } = {}) => {
    if (!target) return;
    const wasHidden = target.hidden;
    target.hidden = false;
    if (current) {
      steps.forEach(item => item.classList.remove('is-current'));
      target.classList.add('is-current');
    }
    if (wasHidden) {
      target.classList.add('is-revealed');
      if (follow) gentlyFollow(target);
    }
  };

  const compact = (target, text) => {
    if (!target) return;
    target.classList.add('is-complete');
    target.classList.remove('is-current');
    showSummary(target, text);
  };

  const syncGoalRequirement = () => {
    goalChoices.forEach(choice => { choice.required = false; });
    if (!selectedGoals().length && goalChoices[0]) goalChoices[0].required = true;
  };

  const handleAppointment = ({ follow = true } = {}) => {
    const choice = selected(appointmentChoices);
    if (!choice) return;
    compact(step(1), appointmentSummary(choice.value));
    reveal(step(2), { current: true, follow });
  };

  const handleGoals = ({ follow = true } = {}) => {
    const goals = selectedGoals();
    syncGoalRequirement();
    if (!goals.length) return;
    step(2)?.classList.add('is-complete', 'is-current');
    showSummary(step(2), goals.map(goal => goal.value).join(', '));
    reveal(step(3), { current: false, follow });
  };

  const handleLocation = ({ follow = true } = {}) => {
    const choice = selected(locationChoices);
    if (!choice) return;
    const goals = selectedGoals();
    if (goals.length) compact(step(2), goals.map(goal => goal.value).join(', '));
    compact(step(3), choice.value);
    reveal(step(4), { current: true, follow });
  };

  appointmentChoices.forEach(choice => choice.addEventListener('change', () => handleAppointment()));
  goalChoices.forEach(choice => choice.addEventListener('change', () => handleGoals()));
  locationChoices.forEach(choice => choice.addEventListener('change', () => handleLocation()));
  syncGoalRequirement();

  if (selected(appointmentChoices)) handleAppointment({ follow: false });
  if (selectedGoals().length) handleGoals({ follow: false });
  if (selected(locationChoices) && selectedGoals().length) handleLocation({ follow: false });

  return { syncGoalRequirement };
}
