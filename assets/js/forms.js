/* ============================================================
   CODING KIDS — TIMS Institute | forms.js
   Frontend form validation & submission handling
   NOTE: Backend integration to be connected later.
         No actual data is sent to any server.
   ============================================================ */

(function () {
  'use strict';

  /* ── Validators ──────────────────────────────────────────── */
  const validators = {
    required: (v) => v.trim() !== '',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    phone: (v) => /^[6-9]\d{9}$/.test(v.replace(/\s|-/g, '')),
    minLen: (min) => (v) => v.trim().length >= min,
  };

  function generateAppId(prefix = 'CK') {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${year}-${random}`;
  }

  /* ── Field Validation ────────────────────────────────────── */
  function validateField(input, rules) {
    let error = '';

    for (const rule of rules) {
      const val = input.value;

      if (rule.type === 'required' && !validators.required(val)) {
        error = rule.message || 'This field is required.';
        break;
      }
      if (rule.type === 'email' && val && !validators.email(val)) {
        error = rule.message || 'Please enter a valid email address.';
        break;
      }
      if (rule.type === 'phone' && val && !validators.phone(val)) {
        error = rule.message || 'Please enter a valid 10-digit mobile number.';
        break;
      }
      if (rule.type === 'minLen' && val && !validators.minLen(rule.min)(val)) {
        error = rule.message || `Minimum ${rule.min} characters required.`;
        break;
      }
    }

    const group = input.closest('.form-group');
    if (!group) return !error;

    const errEl = group.querySelector('.form-error');

    input.classList.toggle('error', !!error);
    input.classList.toggle('success', !error && input.value.trim() !== '');

    if (errEl) {
      errEl.textContent = error;
      errEl.classList.toggle('visible', !!error);
    }

    return !error;
  }

  /* ── Show Success Modal ──────────────────────────────────── */
  function showSuccessModal(appId, title, description) {
    const overlay = document.getElementById('success-modal');
    if (!overlay) return;

    const idEl   = overlay.querySelector('.modal-app-id');
    const titleEl = overlay.querySelector('.modal-title');
    const bodyEl  = overlay.querySelector('.modal-body');

    if (idEl)    idEl.textContent   = appId;
    if (titleEl) titleEl.textContent = title || 'Application Submitted!';
    if (bodyEl)  bodyEl.innerHTML   = description || 'Your application form has been completed successfully.';

    window.openModal(overlay);
  }

  /* ── Application Form (#apply-form) ─────────────────────── */
  function initApplyForm() {
    const form = document.getElementById('apply-form');
    if (!form) return;

    // Scholarship conditional section
    const scholarshipRadios = form.querySelectorAll('input[name="scholarship"]');
    const scholarshipSection = form.querySelector('#scholarship-extra');

    scholarshipRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (scholarshipSection) {
          scholarshipSection.classList.toggle('visible', radio.value === 'yes');
        }
      });
    });

    // Inline validation on blur
    const fieldRules = {
      'fullName':       [{ type: 'required' }, { type: 'minLen', min: 2 }],
      'class':          [{ type: 'required' }],
      'school':         [{ type: 'required' }],
      'phone':          [{ type: 'required' }, { type: 'phone' }],
      'email':          [{ type: 'required' }, { type: 'email' }],
      'city':           [{ type: 'required' }],
      'state':          [{ type: 'required' }],
      'parentName':     [{ type: 'required' }],
      'parentPhone':    [{ type: 'required' }, { type: 'phone' }],
      'relationship':   [{ type: 'required' }],
      'course':         [{ type: 'required' }],
    };

    Object.entries(fieldRules).forEach(([name, rules]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      input.addEventListener('blur', () => validateField(input, rules));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) validateField(input, rules);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let valid = true;
      Object.entries(fieldRules).forEach(([name, rules]) => {
        const input = form.querySelector(`[name="${name}"]`);
        if (input && !validateField(input, rules)) valid = false;
      });

      // Checkbox
      const checkbox = form.querySelector('[name="terms"]');
      if (checkbox && !checkbox.checked) {
        const group = checkbox.closest('.form-group') || checkbox.parentElement;
        const err = group ? group.querySelector('.form-error') : null;
        if (err) { err.textContent = 'Please confirm that the information is correct.'; err.classList.add('visible'); }
        valid = false;
      }

      if (!valid) {
        window.showToast('Please fill in all required fields correctly.', 'error');
        const firstError = form.querySelector('.form-control.error');
        if (firstError) firstError.focus();
        return;
      }

      // Send to backend
      const btn = form.querySelector('[type="submit"]');
      if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
      }

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(resData => {
        if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
        if (resData.error) {
          window.showToast(resData.error, 'error');
          return;
        }
        showSuccessModal(
          resData.appId,
          'Application Completed!',
          `<strong>Application form completed successfully.</strong><br><br>
           Your application ID is shown below. Please save it for reference.`
        );
        form.reset();
        form.querySelectorAll('.form-control').forEach(f => f.classList.remove('success','error'));
        if (scholarshipSection) scholarshipSection.classList.remove('visible');
        form.querySelectorAll('.form-radio-label').forEach(l => l.classList.remove('selected'));
      })
      .catch(err => {
        if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
        window.showToast('Failed to submit application. Please try again.', 'error');
      });
    });
  }

  /* ── Scholarship Form (#scholarship-form) ────────────────── */
  function initScholarshipForm() {
    const form = document.getElementById('scholarship-form');
    if (!form) return;

    const fieldRules = {
      'studentName': [{ type: 'required' }],
      'class':       [{ type: 'required' }],
      'school':      [{ type: 'required' }],
      'parentName':  [{ type: 'required' }],
      'parentPhone': [{ type: 'required' }, { type: 'phone' }],
      'email':       [{ type: 'email' }],
      'city':        [{ type: 'required' }],
    };

    Object.entries(fieldRules).forEach(([name, rules]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      input.addEventListener('blur', () => validateField(input, rules));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) validateField(input, rules);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let valid = true;
      Object.entries(fieldRules).forEach(([name, rules]) => {
        const input = form.querySelector(`[name="${name}"]`);
        if (input && !validateField(input, rules)) valid = false;
      });

      const checkbox = form.querySelector('[name="terms"]');
      if (checkbox && !checkbox.checked) {
        const group = checkbox.parentElement;
        const err = group ? group.querySelector('.form-error') : null;
        if (err) { err.textContent = 'Please confirm your agreement.'; err.classList.add('visible'); }
        valid = false;
      }

      if (!valid) {
        window.showToast('Please fill in all required fields correctly.', 'error');
        return;
      }

      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.classList.add('loading'); btn.disabled = true; }

      setTimeout(() => {
        if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
        const appId = generateAppId('SCH');
        showSuccessModal(
          appId,
          'Registration Successful!',
          `<strong>Your scholarship challenge registration is complete.</strong><br><br>
           Your registration ID is shown below. You will be notified about the test schedule.<br><br>
           <em style="font-size:.8rem;color:var(--muted)">Note: Backend submission will be connected later. No data has been sent to any server at this time.</em>`
        );
        form.reset();
        form.querySelectorAll('.form-control').forEach(f => f.classList.remove('success','error'));
        form.querySelectorAll('.form-radio-label').forEach(l => l.classList.remove('selected'));
      }, 1400);
    });
  }

  /* ── Contact Form (#contact-form) ────────────────────────── */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const fieldRules = {
      'name':    [{ type: 'required' }],
      'email':   [{ type: 'required' }, { type: 'email' }],
      'subject': [{ type: 'required' }],
      'message': [{ type: 'required' }, { type: 'minLen', min: 20 }],
    };

    Object.entries(fieldRules).forEach(([name, rules]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;
      input.addEventListener('blur', () => validateField(input, rules));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) validateField(input, rules);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let valid = true;
      Object.entries(fieldRules).forEach(([name, rules]) => {
        const input = form.querySelector(`[name="${name}"]`);
        if (input && !validateField(input, rules)) valid = false;
      });

      if (!valid) {
        window.showToast('Please fill in all required fields correctly.', 'error');
        return;
      }

      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.classList.add('loading'); btn.disabled = true; }

      setTimeout(() => {
        if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
        window.showToast('Message sent successfully! We will get back to you soon.', 'success', 4000);
        form.reset();
        form.querySelectorAll('.form-control').forEach(f => f.classList.remove('success','error'));
      }, 1200);
    });
  }

  /* ── Init ────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initApplyForm();
    initScholarshipForm();
    initContactForm();
  });

})();
