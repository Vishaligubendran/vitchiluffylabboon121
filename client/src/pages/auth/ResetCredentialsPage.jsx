import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';
import PinInput from '../../components/PinInput';
import ConfirmPasswordField from '../../components/ConfirmPasswordField';
import './LoginPage.css';

export default function ResetCredentialsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [newPin, setNewPin] = useState(null);
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
    pin: '',
    useCustomPin: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid reset link');
      return;
    }
    if (form.useCustomPin && form.pin.length !== 8) {
      toast.error('PIN must be exactly 8 digits');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        token,
        password: form.password,
        confirmPassword: form.confirmPassword,
      };
      if (form.useCustomPin) payload.pin = form.pin;

      const res = await authApi.resetCredentials(payload);
      setNewPin(res.data.pin);
      toast.success('Credentials updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Invalid link</h1>
          <p className="subtitle">Request a new reset from the login page.</p>
          <Link to="/reset">Request reset</Link>
        </div>
      </div>
    );
  }

  if (newPin) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Your new PIN</h1>
          <p className="subtitle">Save this 8-digit PIN now. It will not be shown again.</p>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 6,
              textAlign: 'center',
              padding: 24,
              background: '#fef3c7',
              borderRadius: 8,
              marginBottom: 20,
              fontWeight: 700,
            }}
          >
            {newPin}
          </div>
          <button className="btn-primary" type="button" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 440 }}>
        <h1>Set new credentials</h1>
        <p className="subtitle">Choose a new password. PIN can be auto-generated or set manually.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>New Password</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <ConfirmPasswordField
            password={form.password}
            confirmPassword={form.confirmPassword}
            onChange={(val) => setForm((f) => ({ ...f, confirmPassword: val }))}
          />
          <div className="toggle-box" style={{ marginBottom: 16 }}>
            <div>
              <strong>Set custom 8-digit PIN</strong>
              <p>Leave off to auto-generate a secure PIN</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={form.useCustomPin}
                onChange={(e) => setForm((f) => ({ ...f, useCustomPin: e.target.checked }))}
              />
              <span className="slider" />
            </label>
          </div>
          {form.useCustomPin && (
            <div className="field">
              <label>New PIN</label>
              <PinInput value={form.pin} onChange={(pin) => setForm((f) => ({ ...f, pin }))} />
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update PIN & Password'}
          </button>
        </form>
        <p className="signup-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
