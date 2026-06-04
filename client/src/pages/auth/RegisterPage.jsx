import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import { getApiErrorMessage } from '../../utils/apiError';
import { handleGoogleAuthResult } from '../../utils/googleAuthFlow';
import ConfirmPasswordField from '../../components/ConfirmPasswordField';
import { normalizeMobile, validateRegisterForm } from '../../utils/validation';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

const emptyForm = () => ({
  fullName: '',
  username: '',
  email: '',
  mobile: '',
  password: '',
  confirmPassword: '',
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState('buyer');
  const [buyerForm, setBuyerForm] = useState(emptyForm);
  const [sellerForm, setSellerForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState([]);

  const form = role === 'buyer' ? buyerForm : sellerForm;
  const setForm = role === 'buyer' ? setBuyerForm : setSellerForm;

  const switchRole = (nextRole) => {
    setRole(nextRole);
    setFieldErrors([]);
    setSuccess(null);
  };

  const update = (key, val) => {
    setFieldErrors([]);
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { errors, mobile } = validateRegisterForm(form);
    if (errors.length) {
      setFieldErrors(errors);
      toast.error(errors[0]);
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      mobile,
      password: form.password,
      confirmPassword: form.confirmPassword,
    };

    setLoading(true);
    try {
      const res =
        role === 'buyer'
          ? await authApi.registerBuyer(payload)
          : await authApi.registerSeller(payload);

      const emailSent = res.data.emailDelivery === 'sent';
      const verifyUrl =
        !emailSent && res.data.verificationToken
          ? `${window.location.origin}/verify-email?token=${res.data.verificationToken}`
          : null;

      setSuccess({
        pin: res.data.pin,
        role,
        email: payload.email,
        verifyUrl,
        emailSent,
        emailPreviewUrl: res.data.emailPreviewUrl || null,
        message: res.data.message,
        registeredWithGoogle: false,
      });

      if (role === 'buyer') setBuyerForm(emptyForm);
      else setSellerForm(emptyForm);

      toast.success('Registration successful');
    } catch (err) {
      const data = err.response?.data;
      const list = Array.isArray(data?.errors)
        ? data.errors.map((e) => `${e.field}: ${e.message}`)
        : [];
      const msg = list.length ? list.join(' · ') : getApiErrorMessage(err, 'Registration failed');
      setFieldErrors(list.length ? list : msg.split(' · ').filter(Boolean));
      toast.error(msg, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (idToken) => {
    setGoogleLoading(true);
    try {
      await handleGoogleAuthResult({ idToken, login, navigate });
    } finally {
      setGoogleLoading(false);
    }
  };

  if (success) {
    const isSeller = success.role === 'seller';
    const viaGoogle = success.registeredWithGoogle;

    return (
      <div className="login-page">
        <div className="login-card" style={{ maxWidth: 480 }}>
          <h1>{isSeller ? 'Seller account created' : 'Buyer account created'}</h1>
          <p className="subtitle">{success.message}</p>

          {viaGoogle && (
            <div className="status-panel status-success">
              <span className="status-icon">✓</span>
              <p>
                <strong>Email verified via Google</strong>
              </p>
              <p className="subtitle">No verification email needed — you can sign in anytime.</p>
            </div>
          )}

          <div className="pin-reveal-box">
            <p className="pin-reveal-label">Your 8-digit PIN (save now)</p>
            <div className="pin-reveal-value">{success.pin}</div>
          </div>

          {!viaGoogle && (
            <div className="verify-box">
              <p className="subtitle" style={{ marginBottom: 8 }}>
                <strong>Step 2 — Email verification</strong>
              </p>
              {success.emailSent ? (
                <>
                  <div className="status-panel status-info" style={{ marginBottom: 12 }}>
                    <span className="status-icon">✉️</span>
                    <p>
                      <strong>Check your email inbox</strong>
                    </p>
                    <p className="subtitle">
                      We sent a verification link to <strong>{success.email}</strong>
                      <br />
                      Works with Gmail, Outlook, Yahoo, or any email — check inbox and spam.
                    </p>
                  </div>
                  {success.emailPreviewUrl ? (
                    <a
                      href={success.emailPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="verify-link"
                      style={{ display: 'block', marginTop: 12 }}
                    >
                      Open verification email (dev preview)
                    </a>
                  ) : (
                    <p className="subtitle" style={{ fontSize: 13 }}>
                      Open the email and click <strong>Verify Email</strong>, then sign in.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="subtitle" style={{ fontSize: 14 }}>
                    SMTP is not configured — use this development link:
                  </p>
                  {success.verifyUrl && (
                    <a href={success.verifyUrl} className="verify-link">
                      {success.verifyUrl}
                    </a>
                  )}
                </>
              )}
            </div>
          )}

          {isSeller && (
            <div className="kyc-pending-box">
              <p>
                <strong>{viaGoogle ? 'Next — KYC onboarding' : 'Step 3 — KYC (after email verify)'}</strong>
              </p>
              <p>Sellers must complete KYC onboarding after signing in.</p>
            </div>
          )}

          <button className="btn-primary" type="button" onClick={() => navigate('/login')}>
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 480 }}>
        <h1>Create Account</h1>
        <p className="subtitle">Register with email (choose Buyer or Seller)</p>

        <div className="login-tabs">
          <button
            type="button"
            className={role === 'buyer' ? 'active' : ''}
            onClick={() => switchRole('buyer')}
          >
            Buyer
          </button>
          <button
            type="button"
            className={role === 'seller' ? 'active' : ''}
            onClick={() => switchRole('seller')}
          >
            Seller
          </button>
        </div>

        {fieldErrors.length > 0 && (
          <ul className="validation-errors">
            {fieldErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        <form key={role} onSubmit={handleSubmit}>
          <div className="field">
            <label>Full Name</label>
            <input
              className="form-input"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="field">
            <label>Username</label>
            <input
              className="form-input"
              value={form.username}
              onChange={(e) => update('username', e.target.value.replace(/\s/g, ''))}
              placeholder="letters, numbers, underscore"
              autoComplete="off"
              required
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <div className="field">
            <label>Mobile (10 digits)</label>
            <input
              className="form-input"
              type="tel"
              value={form.mobile}
              onChange={(e) => update('mobile', normalizeMobile(e.target.value))}
              placeholder="9876543210"
              maxLength={12}
              autoComplete="off"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="e.g. SecurePass1"
              autoComplete="new-password"
              required
            />
          </div>
          <ConfirmPasswordField
            password={form.password}
            confirmPassword={form.confirmPassword}
            onChange={(val) => update('confirmPassword', val)}
          />
          <button className="btn-primary" type="submit" disabled={loading || googleLoading}>
            {loading ? 'Registering...' : role === 'seller' ? 'Register as Seller' : 'Register as Buyer'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <GoogleSignInButton
          mode="signup"
          disabled={loading || googleLoading}
          onSuccess={handleGoogleSuccess}
        />

        <p className="signup-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
