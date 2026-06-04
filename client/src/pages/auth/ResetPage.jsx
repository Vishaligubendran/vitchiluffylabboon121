import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';
import './LoginPage.css';

export default function ResetPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.requestReset(email);
      setSent(true);
      toast.success(res.data.message || 'Check your email for the reset link');
      if (res.data.resetToken) {
        console.info('Dev reset link:', `/reset-credentials?token=${res.data.resetToken}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Reset PIN / Password</h1>
        <p className="subtitle">
          Enter your verified account email. You will receive a link to set a new password and PIN.
        </p>
        {sent ? (
          <p className="subtitle" style={{ color: '#166534' }}>
            If your email is registered and verified, a reset link was sent. In development, check the API
            server console for the link.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
        <p className="signup-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
