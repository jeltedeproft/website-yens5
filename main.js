// ==========================================================================
// Premium Interactivity & Logic
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Loader Animation
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.classList.add('hidden');
  }, 2000); // 2 second premium loading feel

  // 2. Navbar Scroll Effect
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // 3. Dark Mode Toggle
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const html = document.documentElement;
  
  // Check local storage or system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme');
  
  if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
    html.setAttribute('data-theme', 'dark');
  }

  darkModeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    if (currentTheme === 'dark') {
      html.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  });

  // 4. Scroll Reveal Animations (Intersection Observer)
  const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  
  const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  // 5. Interactive Longevity Age Calculator
  const ageInput = document.getElementById('age-input');
  const sleepInput = document.getElementById('sleep-input');
  const exerciseInput = document.getElementById('exercise-input');
  
  const ageVal = document.getElementById('age-val');
  const sleepVal = document.getElementById('sleep-val');
  const exerciseVal = document.getElementById('exercise-val');
  const bioAgeResult = document.getElementById('bio-age-result');

  function calculateBioAge() {
    const chronAge = parseInt(ageInput.value);
    const sleep = parseInt(sleepInput.value);
    const exercise = parseInt(exerciseInput.value);
    
    // Simple heuristic calculation for preview purposes
    let bioAge = chronAge;
    
    // Sleep impact
    if (sleep >= 7 && sleep <= 8) bioAge -= 2;
    else if (sleep < 6) bioAge += 3;
    else if (sleep > 9) bioAge += 1;
    
    // Exercise impact
    if (exercise >= 4) bioAge -= 3;
    else if (exercise >= 2) bioAge -= 1;
    else if (exercise === 0) bioAge += 4;
    
    // Animate the result change
    animateValue(bioAgeResult, parseInt(bioAgeResult.innerText), bioAge, 500);
  }

  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // Add event listeners to inputs
  [ageInput, sleepInput, exerciseInput].forEach(input => {
    input.addEventListener('input', (e) => {
      // Update labels immediately
      if(e.target.id === 'age-input') ageVal.innerText = e.target.value;
      if(e.target.id === 'sleep-input') sleepVal.innerText = e.target.value;
      if(e.target.id === 'exercise-input') exerciseVal.innerText = e.target.value;
    });
    
    input.addEventListener('change', calculateBioAge);
  });

  // Initial calculation
  calculateBioAge();
});
