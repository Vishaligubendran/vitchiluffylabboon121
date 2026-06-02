export function normalizeMobile(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function validateRegisterForm(form) {
  const errors = [];

  if (!form.fullName?.trim() || form.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username?.trim() || '')) {
    errors.push('Username: 3–30 chars, letters/numbers/underscore only');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email?.trim() || '')) {
    errors.push('Enter a valid email address');
  }

  const mobile = normalizeMobile(form.mobile);
  if (!/^[0-9]{10}$/.test(mobile)) {
    errors.push('Mobile: exactly 10 digits (e.g. 9876543210 — no +91 prefix)');
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password || '')) {
    errors.push('Password: 8+ chars with uppercase, lowercase, and number');
  }
  if (form.password !== form.confirmPassword) {
    errors.push('Passwords do not match');
  }

  return { errors, mobile };
}

export function suggestUsernameFromEmail(email) {
  let base = (email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (base.length < 3) base = `user_${base}`.replace(/^_+/, 'user');
  return base.slice(0, 30);
}

export function validateGoogleRegisterFields({ username, mobile }) {
  const errors = [];
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username?.trim() || '')) {
    errors.push('Username: 3–30 chars, letters/numbers/underscore only');
  }
  const normalized = normalizeMobile(mobile);
  if (!/^[0-9]{10}$/.test(normalized)) {
    errors.push('Mobile: exactly 10 digits (e.g. 9876543210)');
  }
  return { errors, mobile: normalized };
}
