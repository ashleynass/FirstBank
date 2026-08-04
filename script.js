/* ============================
   DOM references
============================ */
const rateCard = document.getElementById('rate-card');
const rateTargetLabel = document.getElementById('rates-target-currency');

const form = document.getElementById('lead-form');
const nameInput = document.getElementById('full-name');
const nameError = document.getElementById('full-name-error');
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');
const currencyInput = document.getElementById('currency');
const currencyError = document.getElementById('currency-error');
const successBox = document.getElementById('form-success');

/* ============================
   Exchange rate: rendering
============================ */
function renderRate(data) {
  const rateInfo = data[0]; // API returns an array
  const updated = new Date(rateInfo.time);
  const isoTime = updated.toISOString();
  const readableTime = updated.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  rateCard.innerHTML = `
<p>Exchange rate: <strong class="rate-figure">${rateInfo.rate.toFixed(4)}</strong></p><br>
 <p>Source: <strong>${rateInfo.source}</strong></p>
    <p>Target: <strong>${rateInfo.target}</strong></p>
    <p class="rate-updated">Last updated: <time datetime="${isoTime}">${readableTime}</time></p>
  `;

  if (rateTargetLabel) {
    rateTargetLabel.textContent = rateInfo.target;
  }
}

function renderError() {
  rateCard.innerHTML = `
    <p role="alert">We couldn't load today's rate right now. Please refresh, or contact a banker for current pricing.</p>
  `;
}

// NOTE: Using mocked data for this exercise — see commented-out real
// implementation above. allratestoday.com's authenticated endpoint is
// server-side-only by design (confirmed in their docs) and cannot be
// called directly from a browser due to CORS.
/* ============================
   Exchange rate: fetch + orchestration
============================ */
async function fetchRate(target) {
  // Real implementation — kept for reference / restoring later.
  // const res = await fetch(`https://allratestoday.com/api/v1/rates?source=USD&target=${target}`, {
  //   headers: { 'Authorization': 'Bearer art_live_KCeNy8VUrVz1lY4qtL7BtWkbDoENZCaW' }
  // });
  // if (!res.ok) throw new Error('Rate service unavailable');
  // return res.json();

  // Mocked response — matches the real API's confirmed shape.
  const mockRates = {
    EUR: 0.86881,
    JPY: 149.32,
    GBP: 0.7891,
    AUD: 1.5123,
    CAD: 1.3654
  };

  return [{
    rate: mockRates[target] ?? 1,
    source: 'USD',
    target: target,
    time: new Date().toISOString()
  }];
}

async function updateRateDisplay(target) {
  rateCard.hidden = false;                    
  rateCard.setAttribute('aria-busy', 'true');
  rateCard.innerHTML = '<p>Loading today\'s rate…</p>';  
  try {
    const data = await fetchRate(target);      
    renderRate(data);                          
    return true;
  } catch (err) {
    renderError();
    return false;
  } finally {
    rateCard.removeAttribute('aria-busy');
  }
}

function scrollToRateCard() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  rateCard.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start'
  });
}

/* ============================
   Form validation
============================ */
function validateName(value) {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return 'Enter your full name.';
  }
  if (trimmed.length < 2) {
    return 'Name must be at least 2 characters.';
  }
  if (!trimmed.includes(' ')) {
    return 'Enter your first and last name.';
  }
  return true;
}

function validateEmail(value) {
  if (value.trim().length === 0) return 'Enter your email address.';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value.trim())) {
    return 'Enter an email address in the format name@example.com.';
  }
  return true;
}

function validateCurrency(value) {
  return value !== '' || "Select a currency you're interested in.";
}

function applyValidation(input, errorEl, validateFn) {
  const result = validateFn(input.value);
  if (result === true) {
    input.removeAttribute('aria-invalid');
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
    return true;
  } else {
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = result;
    errorEl.classList.add('visible');
    return false;
  }
}

/* ============================
   Success message
============================ */
function showSuccessMessage(rateLoaded) {
  successBox.textContent = rateLoaded
    ? "Thanks — we've got your details. We've updated the rate above for you."
    : "Thanks — we've got your details. We'll follow up with your rate shortly.";
  successBox.classList.add('visible');
  successBox.focus();
}

/* ============================
   Submit handler
============================ */
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const nameValid = applyValidation(nameInput, nameError, validateName);
  const emailValid = applyValidation(emailInput, emailError, validateEmail);
  const currencyValid = applyValidation(currencyInput, currencyError, validateCurrency);

  if (!nameValid || !emailValid || !currencyValid) {
    if (!nameValid) nameInput.focus();
    else if (!emailValid) emailInput.focus();
    else currencyInput.focus();
    return;
  }

  rateCard.hidden = false;
const rateLoaded = await updateRateDisplay(currencyInput.value);
  if (rateLoaded) {
    scrollToRateCard();
  }
  showSuccessMessage(rateLoaded);
  form.reset();
});

