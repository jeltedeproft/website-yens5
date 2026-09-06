export const APPOINTMENTS = Object.freeze({
  'gratis-kennismaking': Object.freeze({ label: 'Gratis kennismaking', duration: 15, price: 0, description: 'Gratis telefonisch kennismakingsgesprek van ongeveer 15 minuten. Geen training. We maken kort kennis, beantwoorden je vragen en bekijken of personal training passend lijkt.' }),
  'eerste-training': Object.freeze({ label: 'Eerste training', duration: 60, price: 65, description: 'Intake, bewegingsanalyse & eerste training. We brengen je doelen en vertrekpunt in kaart en gaan meteen samen aan de slag.' })
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
  const telephoneRequired = form.querySelector('#telephone-required');
  const submit = form.querySelector('[type="submit"]');
  const fields = ['afspraak_type', 'afspraak_duur', 'afspraak_prijs'].map(name => form.querySelector(`[name="${name}"]`));
  const selectedValue = () => choices.find(choice => choice.checked)?.value || '';
  const sync = () => {
    const value = selectedValue();
    const appointment = appointmentFor(value);
    summary.textContent = appointment ? `Geselecteerd: ${appointmentSummary(value)}` : 'Kies hierboven je afspraak. Daarna zie je hier het type, de duur en de prijs.';
    description.textContent = appointment?.description || '';
    fields.forEach((field, index) => { field.value = appointment ? [appointment.label, `${appointment.duration} minuten`, `€${appointment.price}`][index] : ''; });
    telephone.required = value === 'gratis-kennismaking';
    telephoneRequired.hidden = !telephone.required;
    submit.textContent = appointment ? `Vraag ${appointment.label.toLowerCase()} aan` : 'Verstuur je aanvraag';
    const wrapper = telephone.closest('.field');
    if (!telephone.required) {
      wrapper?.classList.remove('field--error');
      wrapper?.querySelector('.field__error')?.remove();
      telephone.removeAttribute('aria-invalid');
    }
  };
  const requested = new URLSearchParams(search).get('afspraak');
  if (appointmentFor(requested)) choices.forEach(choice => { choice.checked = choice.value === requested; });
  choices.forEach(choice => choice.addEventListener('change', sync));
  sync();
  return {
    summary: () => appointmentSummary(selectedValue()),
    resetDetails() {
      const value = selectedValue();
      form.reset();
      choices.forEach(choice => { choice.checked = choice.value === value; });
      sync();
    }
  };
}
