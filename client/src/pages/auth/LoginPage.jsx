import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PinInput from '../../components/PinInput';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import { getApiErrorMessage } from '../../utils/apiError';
import { redirectByRole } from '../../utils/authRedirect';
import { handleGoogleAuthResult } from '../../utils/googleAuthFlow';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    if (searchParams.get('verified') === 'seller') {
      toast.success('Email verified. Sign in, then complete seller KYC onboarding.');
    } else if (searchParams.get('verified')) {
      toast.success('Email verified. You can sign in now.');
    }
  }, [searchParams]);

  const [mode, setMode] = useState('pin');
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (mode === 'pin') {
        const pinValue = pin.trim();
        if (pinValue.length !== 8) {
          toast.error('PIN must be exactly 8 digits');
          setLoading(false);
          return;
        }
        res = await authApi.loginPin(pinValue);
      } else {
        if (!identifier || !password) {
          toast.error('Enter username/email and password');
          setLoading(false);
          return;
        }
        res = await authApi.loginPassword(identifier, password);
      }
      login(res.data);
      toast.success('Signed in successfully');
      await redirectByRole(navigate, res.data.user);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Login failed'));
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

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Welcome Back</h1>
        <p className="subtitle">Sign in to your account</p>

        <div className="login-tabs">
          <button
            type="button"
            className={mode === 'pin' ? 'active' : ''}
            onClick={() => setMode('pin')}
          >
            Sign in with PIN
          </button>
          <button
            type="button"
            className={mode === 'password' ? 'active' : ''}
            onClick={() => setMode('password')}
          >
            Email / Username
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'pin' ? (
            <div className="field">
              <label>8-Digit PIN</label>
              <PinInput value={pin} onChange={setPin} />
            </div>
          ) : (
            <>
              <div className="field">
                <label>Email or Username</label>
                <input
                  className="form-input"
                  placeholder="Enter email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  lang="en"
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  lang="en"
                />
              </div>
              <div className="forgot-row">
                <Link to="/reset">Reset PIN / Password</Link>
              </div>
            </>
          )}

          <button className="btn-primary" type="submit" disabled={loading || googleLoading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <GoogleSignInButton
          mode="signin"
          onSuccess={handleGoogleSuccess}
          disabled={loading || googleLoading}
        />

        <p className="signup-footer">
          Don&apos;t have an account? <Link to="/register">Sign up with email</Link>
        </p>
      </div>
    </div>
  );
}
