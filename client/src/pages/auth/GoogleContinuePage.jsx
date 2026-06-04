import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { buyerApi, sellerApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { redirectByRole } from '../../utils/authRedirect';
import {
  normalizeMobile,
  validateGoogleRegisterFields,
  suggestUsernameFromEmail,
} from '../../utils/validation';
import { clearGooglePending, loadGooglePending } from '../../utils/googleAuth';
import './LoginPage.css';

export default function GoogleContinuePage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [pending, setPending] = useState(null);
  const [step, setStep] = useState('role');
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState([]);
  const [form, setForm] = useState({ fullName: '', username: '', mobile: '' });

  useEffect(() => {
    const data = loadGooglePending();
    if (!data?.idToken) {
      navigate('/login', { replace: true });
      return;
    }
    setPending(data);
    setForm({
      fullName: data.fullName || '',
      username: suggestUsernameFromEmail(data.email),
      mobile: '',
    });
  }, [navigate]);

  const chooseRole = (nextRole) => {
    setRole(nextRole);
    setStep('details');
    setFieldErrors([]);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!pending?.idToken || !role) return;

    const { errors, mobile } = validateGoogleRegisterFields(form);
    if (errors.length) {
      setFieldErrors(errors);
      toast.error(errors[0]);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        idToken: pending.idToken,
        username: form.username.trim().toLowerCase(),
        mobile,
        fullName: form.fullName?.trim() || undefined,
      };

      const res =
        role === 'buyer'
          ? await buyerApi.registerGoogle(payload)
          : await sellerApi.registerGoogle(payload);

      clearGooglePending();
      login(res.data);
      toast.success(
        role === 'seller'
          ? 'Seller account created — complete KYC next'
          : 'Buyer account created'
      );

      if (res.data.pin) {
        toast.success(`Your PIN: ${res.data.pin} — save it now`, { duration: 8000 });
      }

      await redirectByRole(navigate, res.data.user, { newSeller: role === 'seller' });
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Registration failed');
      setFieldErrors([msg]);
      toast.error(msg, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    clearGooglePending();
    navigate('/login');
  };

  if (!pending) return null;

  if (step === 'role') {
    return (
      <div className="login-page">
        <div className="login-card" style={{ maxWidth: 440 }}>
          <h1>Welcome</h1>
          <p className="subtitle">Signed in with Google as</p>

          <div className="google-profile-box">
            {pending.picture && (
              <img src={pending.picture} alt="" className="google-avatar" />
            )}
            <div>
              <p className="google-profile-name">{pending.fullName || 'Google user'}</p>
              <p className="google-profile-email">{pending.email}</p>
            </div>
          </div>

          <p className="role-choice-label">Continue as:</p>
          <div className="role-choice-grid">
            <button
              type="button"
              className="role-choice-card buyer"
              onClick={() => chooseRole('buyer')}
            >
              <span className="role-choice-icon">🛒</span>
              <strong>Buyer</strong>
              <span className="role-choice-desc">Shop and browse local stores</span>
            </button>
            <button
              type="button"
              className="role-choice-card seller"
              onClick={() => chooseRole('seller')}
            >
              <span className="role-choice-icon">🏪</span>
              <strong>Seller</strong>
              <span className="role-choice-desc">List your shop on NammaLocal</span>
            </button>
          </div>

          <button type="button" className="btn-secondary role-cancel" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 440 }}>
        <h1>{role === 'seller' ? 'Seller' : 'Buyer'} account</h1>
        <p className="subtitle">
          Google: <strong>{pending.email}</strong>
        </p>

        <button
          type="button"
          className="link-back"
          onClick={() => {
            setStep('role');
            setRole(null);
          }}
        >
          ← Choose Buyer or Seller
        </button>

        {fieldErrors.length > 0 && (
          <ul className="validation-errors">
            {fieldErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        <form onSubmit={handleRegister}>
          <div className="field">
            <label>Full Name</label>
            <input
              className="form-input"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label>Username</label>
            <input
              className="form-input"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value.replace(/\s/g, '') }))
              }
              required
            />
          </div>
          <div className="field">
            <label>Mobile (10 digits)</label>
            <input
              className="form-input"
              type="tel"
              value={form.mobile}
              onChange={(e) =>
                setForm((f) => ({ ...f, mobile: normalizeMobile(e.target.value) }))
              }
              placeholder="9876543210"
              maxLength={12}
              required
            />
          </div>
          {role === 'seller' && (
            <div className="kyc-pending-box">
              <p>Sellers complete KYC onboarding after this step.</p>
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : `Continue as ${role === 'seller' ? 'Seller' : 'Buyer'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
