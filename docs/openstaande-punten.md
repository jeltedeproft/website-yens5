# Openstaande punten

Wat er nog ingevuld of aangesloten moet worden voordat de site live kan.

## 1. Placeholders in de tekst

Deze staan overal in de HTML met een duidelijke dummy-waarde. Zoek en vervang:

| Placeholder | Waar | Vervangen door |
|---|---|---|
| `hallo@yens.be` | alle pagina's (footer, CTA, contact, juridisch) + `main.js` (`CONTACT_EMAIL`) | echt e-mailadres |
| `https://wa.me/32000000000` | sticky CTA, eind-CTA, contactpagina | echt WhatsApp-nummer |
| `BE 0000.000.000` | footer van alle pagina's | ondernemingsnummer |
| `https://instagram.com/` en `https://linkedin.com/` | footer | echte profielen |
| `https://www.yens.be/` | `<link rel="canonical">` en JSON-LD in elke `<head>` | echt domein |
| "Nog aan te vullen" | `index.html` (locaties: adres/parking), `over-mij.html` (opleidingen, certificaten) | echte gegevens |

## 2. Fotografie

De beeldtaal moet één wereld vormen: natuurlijk licht, rustige trainingsomgeving, echte
beweging, warme materialen — geen felle fitnesszaal, geen wellnessluxe, geen losse stockfoto's.

- **Hero** (`index.html`) gebruikt tijdelijk `public/images/hero.jpg` (interieur) met een zichtbaar
  label "Tijdelijk beeld". Vervangen door een foto van Yens tijdens begeleiding, dan het label weghalen.
- **Portret** op de homepage en op `over-mij.html` zijn gestileerde placeholderkaders
  (`.photo-placeholder`). Vervang het hele `<div class="photo-placeholder">…</div>` door
  `<img src="/images/…" alt="…" loading="lazy" width="…" height="…" />`.
- `public/images/sauna.jpg` wordt niet meer gebruikt en mag weg.
- Exporteer nieuwe beelden als **WebP of AVIF** en zet altijd `width`, `height` en een `alt`-tekst.

## 3. Contactformulier

Het formulier verstuurt naar **Netlify Forms** onder de naam `kennismaking`. Het heeft:

- clientside validatie met foutmeldingen per veld;
- een honeypot-veld (`website`), zowel client- als serverside gecontroleerd;
- een verplichte privacy-checkbox;
- verzending via `fetch`, dus zonder herladen van de pagina.

Eenmalig in te stellen in Netlify:

1. **Forms → Enable form detection** aanzetten en daarna opnieuw deployen.
   Zonder deze stap slaat Netlify de inzendingen niet op.
2. **Forms → kennismaking → Settings → Form notifications** → e-mailmelding naar het echte adres.
3. Optioneel: **Forms → Spam filtering** met reCAPTCHA, bovenop het honeypot-veld.

Een automatische bevestigingsmail naar de aanvrager kan met een Netlify Function of een
koppeling naar een mailtool; dat zit er nu nog niet in.

## 4. Juridische pagina's

`privacy.html` en `voorwaarden.html` staan er, inclusief de `#cookies`- en `#annulatie`-secties
waar de footer naar linkt. Ze zijn geschreven op maat van wat de site werkelijk doet, maar het
zijn **concepten**: laat ze nakijken door iemand met juridische kennis voordat je erop vertrouwt.

Nog aan te vullen in beide pagina's: adres en ondernemingsnummer in de tabel bovenaan.

Controleer ook of deze afspraken kloppen met de praktijk — ze staan nu ingevuld als voorstel:

- annulatie kosteloos tot 24 uur vooraf, daarna volledige aanrekening;
- betaling binnen 14 dagen na factuur;
- opzegtermijn van twee weken voor een lopend traject;
- bewaartermijn van 12 maanden voor aanvragen die niet tot een traject leiden.

## 5. Nog aan te sluiten

- Cookiebanner (pas nodig zodra er analytics of externe embeds bijkomen)
- Analytics + Google Search Console
- Google Business Profile koppelen
- Kaart per locatie (`index.html`, sectie Locaties)
- Redirects van oude URL's naar de nieuwe pagina's
- Social sharing image: `og:image` wijst nu naar `/images/hero.jpg`, vervangen door een
  specifiek deelbeeld van 1200×630

## 6. Kennis-pagina

`kennis.html` bevat negen artikelkaarten met de status "In voorbereiding" en een werkend
categoriefilter. Zodra een artikel geschreven is: maak `kennis/<slug>.html`, wikkel de kaart in
een `<a>` en vervang de meta-regel door de publicatiedatum.

## 7. Klantverhalen

De sectie op de homepage staat klaar met drie lege kaders. In de HTML staat een template in
commentaar; plaats echte testimonials pas met toestemming van de klant. Een goed verhaal bevat:
beginsituatie, doel, wat er veranderde, hoe de begeleiding werd ervaren, een concreet resultaat,
voornaam en eventueel leeftijd of beroep.
