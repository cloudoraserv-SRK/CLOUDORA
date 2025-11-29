// Utilities
const $ = (id) => document.getElementById(id);
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');
const showErr = (id, cond) => $(id).classList[cond ? 'add' : 'remove']('show');

// Email validation
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Phone validations
const isCountryCode = (v) => /^\+?\d{1,3}$/.test(v.trim()); // e.g., +91, 91, +1
const isTenDigit = (v) => /^\d{10}$/.test(v.trim());
const isIntlPhone = (v) => /^\+?\d{6,15}$/.test(v.trim());

// Pincode (India 6-digit; extend if needed)
const isPincode = (v) => /^\d{6}$/.test(v.trim());

// File validations (≤ 5MB, allowed types)
const maxSize = 5 * 1024 * 1024;
const validImageTypes = ['image/jpeg','image/png'];
const validDocTypes = ['image/jpeg','image/png','application/pdf'];
const isValidFile = (file, types) => file && types.includes(file.type) && file.size <= maxSize;

// USA slots builder (7–8, 8–9, ... up to 15–16 → 9 slots)
const buildUsaSlots = () => {
  const wrap = $('usaSlots');
  wrap.innerHTML = '';
  const slots = [
    '07:00–08:00','08:00–09:00','09:00–10:00',
    '10:00–11:00','11:00–12:00','12:00–13:00',
    '13:00–14:00','14:00–15:00','15:00–16:00'
  ];
  const container = document.createElement('div');
  container.className = 'flex';
  slots.forEach(s => {
    const label = document.createElement('label');
    label.className = 'tag';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = s;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + s));
    container.appendChild(label);
  });
  wrap.appendChild(container);
};

// Roles lookup per department
const ROLE_MAP = {
  marketing: ['Content Strategist','Social Media Executive','Ad Ops Associate','Brand Copywriter'],
  sales:     ['Inside Sales Rep','BD Associate','Account Executive','Lead Qualifier'],
  design:    ['Graphic Designer','UI Designer','Motion Designer','Brand Designer'],
  development:['Frontend Dev','Backend Dev','Full-stack Dev','QA Tester'],
  seo:       ['SEO Analyst','Technical SEO','Link Building Exec','Content SEO'],
  support:   ['Customer Support Exec','Tech Support','Onboarding Specialist','Success Associate']
};

// Populate roles based on selected departments
const populateRoles = () => {
  const depSel = $('departments');
  const selectedDeps = Array.from(depSel.selectedOptions).map(o => o.value);
  const roleSel = $('roles');
  roleSel.innerHTML = '';
  const roles = new Set();
  selectedDeps.forEach(d => (ROLE_MAP[d] || []).forEach(r => roles.add(r)));
  Array.from(roles).forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    roleSel.appendChild(opt);
  });
};

// Toggle “Other” fields
$('addrProofType').addEventListener('change', (e) => {
  if (e.target.value === 'Other') show($('addrProofOtherWrap')); else hide($('addrProofOtherWrap'));
});
$('hearAbout').addEventListener('change', (e) => {
  if (e.target.value === 'Other') show($('hearOtherWrap')); else hide($('hearOtherWrap'));
});
$('langOtherChk').addEventListener('change', (e) => {
  if (e.target.checked) show($('langOtherWrap')); else hide($('langOtherWrap'));
});

// Employment rules: departments selection limits
$('employmentType').addEventListener('change', () => {
  const type = $('employmentType').value; // 'full' or 'part'
  const depSel = $('departments');
  // Reset selections if rule changes
  Array.from(depSel.options).forEach(o => (o.selected = false));
  if (type === 'full') {
    depSel.multiple = false; // only one department
    depSel.size = 6;
  } else {
    depSel.multiple = true;  // up to 3 departments; enforced on submit
    depSel.size = 6;
  }
  populateRoles();
  toggleUsaSlots();
});

// Departments change → update roles
$('departments').addEventListener('change', () => {
  populateRoles();
});

// Preferred countries + USA slots visibility
const toggleUsaSlots = () => {
  const isPartTime = $('employmentType').value === 'part';
  const wantsUSA = $('prefUS').checked;
  if (isPartTime && wantsUSA) {
    show($('usaSlots'));
    buildUsaSlots();
  } else {
    hide($('usaSlots'));
    $('usaSlots').innerHTML = '';
  }
};
['prefUS'].forEach(id => $(id).addEventListener('change', toggleUsaSlots));

// Save draft (localStorage)
$('saveDraft').addEventListener('click', () => {
  const data = collectData(false);
  localStorage.setItem('cloudoraDraft', JSON.stringify(data));
  alert('Draft saved locally on this device.');
});

// Collect form data
function collectData(includeFiles=true) {
  const langs = Array.from(document.querySelectorAll('input[name="lang"]:checked')).map(i => i.value);
  const usaSelections = Array.from($('usaSlots').querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
  return {
    fullName: $('fullName').value.trim(),
    email: $('email').value.trim(),
    mobilePart1: $('mobilePart1').value.trim(),
    mobilePart2: $('mobilePart2').value.trim(),
    altMobile: $('altMobile').value.trim(),
    addrStreet: $('addrStreet').value.trim(),
    addrCity: $('addrCity').value.trim(),
    addrPincode: $('addrPincode').value.trim(),
    addrState: $('addrState').value.trim(),
    addrCountry: $('addrCountry').value,
    addrProofType: $('addrProofType').value,
    addrProofOther: $('addrProofOther').value.trim(),
    employmentType: $('employmentType').value,
    preferredCountries: {
      CA: $('prefCA').checked, NZ: $('prefNZ').checked, JP: $('prefJP').checked,
      US: $('prefUS').checked, Other: $('prefOtherCountry').checked
    },
    departments: Array.from($('departments').selectedOptions).map(o => o.value),
    roles: Array.from($('roles').selectedOptions).map(o => o.value),
    usaSlots: usaSelections,
    languages: langs,
    langOther: $('langOther').value.trim(),
    understandCloudora: $('understandCloudora').value.trim(),
    hearAbout: $('hearAbout').value,
    hearOther: $('hearOther').value.trim(),
    agree: $('agree').checked,
    files: includeFiles ? {
      photoUpload: $('photoUpload').files[0]?.name || '',
      docFront: $('docFront').files[0]?.name || '',
      docBack: $('docBack').files[0]?.name || ''
    } : undefined
  };
}

// Submission + validation
$('cloudoraForm').addEventListener('submit', (e) => {
  e.preventDefault();

  // Reset error visibility
  document.querySelectorAll('.error').forEach(el => el.classList.remove('show'));
  $('successMsg').style.display = 'none';

  let ok = true;

  // Full name
  if (!$('fullName').value.trim()) { showErr('errFullName', true); ok = false; }

  // Email
  if (!isEmail($('email').value)) { showErr('errEmail', true); ok = false; }

  // Mobile parts
  if (!isCountryCode($('mobilePart1').value)) { showErr('errMobile1', true); ok = false; }
  if (!isTenDigit($('mobilePart2').value)) { showErr('errMobile2', true); ok = false; }

  // Alternate (if provided, validate)
  const alt = $('altMobile').value.trim();
  if (alt && !isIntlPhone(alt)) { showErr('errAltMobile', true); ok = false; }

  // Address fields
  if (!$('addrStreet').value.trim()) { showErr('errAddrStreet', true); ok = false; }
  if (!$('addrCity').value.trim()) { showErr('errAddrCity', true); ok = false; }
  if (!isPincode($('addrPincode').value)) { showErr('errAddrPincode', true); ok = false; }
  if (!$('addrState').value.trim()) { showErr('errAddrState', true); ok = false; }
  if (!$('addrCountry').value) { showErr('errAddrCountry', true); ok = false; }

  // Address proof
  if (!$('addrProofType').value) { showErr('errAddrProofType', true); ok = false; }
  if ($('addrProofType').value === 'Other' && !$('addrProofOther').value.trim()) {
    showErr('errAddrProofType', true); ok = false;
  }

  // Files
  const photo = $('photoUpload').files[0];
  const front = $('docFront').files[0];
  const back  = $('docBack').files[0];

  if (!isValidFile(photo, validImageTypes)) { showErr('errPhotoUpload', true); ok = false; }
  if (!isValidFile(front, validDocTypes))   { showErr('errDocFront', true); ok = false; }
  if (!isValidFile(back, validDocTypes))    { showErr('errDocBack', true); ok = false; }

  // Employment type
  const emp = $('employmentType').value;
  if (!emp) { showErr('errEmploymentType', true); ok = false; }

  // Departments rules
  const deps = Array.from($('departments').selectedOptions).map(o => o.value);
  if (deps.length === 0) { showErr('errDepartments', true); ok = false; }
  if (emp === 'full' && deps.length !== 1) { showErr('errDepartments', true); ok = false; }
  if (emp === 'part' && deps.length > 3) { showErr('errDepartments', true); ok = false; }

  // Roles
  const roles = Array.from($('roles').selectedOptions).map(o => o.value);
  if (roles.length === 0) { showErr('errRoles', true); ok = false; }

  // USA slots (if visible and part-time & USA selected must have at least 1 slot)
  const usaVisible = !$('usaSlots').classList.contains('hidden');
  const usaSelectedSlots = Array.from($('usaSlots').querySelectorAll('input[type="checkbox"]:checked')).length;
  if (usaVisible && emp === 'part' && usaSelectedSlots === 0) {
    alert('Select at least one USA slot for part-time USA preference.');
    ok = false;
  }

  // Languages
  const langChecked = document.querySelectorAll('input[name="lang"]:checked').length;
  if (langChecked === 0) { showErr('errLang', true); ok = false; }
  if ($('langOtherChk').checked && !$('langOther').value.trim()) { showErr('errLang', true); ok = false; }

  // Understand Cloudora
  if ($('understandCloudora').value.trim().length < 20) { showErr('errUnderstand', true); ok = false; }

  // Agreement
  if (!$('agree').checked) { showErr('errAgree', true); ok = false; }

  if (!ok) return;

  const payload = collectData(true);

  // Example: submit to your backend
  // fetch('/api/apply', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)})
  //  .then(res => res.json()).then(() => {
  //    $('successMsg').style.display = 'block';
  //  }).catch(() => alert('Submission failed. Please try again.'));

  console.log('SUBMIT PAYLOAD', payload);
  $('successMsg').style.display = 'block';
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
});

// Initialize
populateRoles();
toggleUsaSlots();

// UX: placeholders as subtle guidance (hidden text in inputs via placeholder)
// Already implemented in HTML via placeholder attributes.
