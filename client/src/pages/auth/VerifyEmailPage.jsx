import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../services/api';
import { getApiErrorMessage } from '../../utils/apiError';
import './LoginPage.css';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');
  const [userRole, setUserRole] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token in the link.');
      return;
    }

    setStatus('verifying');

    authApi
      .verifyEmail(token)
      .then((res) => {
        setUserRole(res.data?.role || null);
        setStatus('success');
        toast.success('Email verified successfully');
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(getApiErrorMessage(err, 'Verification failed'));
      });
  }, [params]);

  const isSeller = userRole === 'seller';

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 440 }}>
        <h1>Email Verification</h1>

        {status === 'pending' && (
          <div className="status-panel status-warn">
            <span className="status-icon">✉️</span>
            <p><strong>Email verification required</strong></p>
            <p className="subtitle">Open the link from your email to verify your account.</p>
          </div>
        )}

        {status === 'verifying' && (
          <div className="status-panel status-warn">
            <span className="status-icon spin">⏳</span>
            <p><strong>Verifying your email…</strong></p>
            <p className="subtitle">Please wait while we confirm your email address.</p>
            {params.get('token') && (
              <p className="subtitle" style={{ fontSize: 13, marginTop: 12 }}>
                Sellers: after this step you will need to complete <strong>KYC verification</strong>{' '}
                when you sign in.
              </p>
            )}
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="status-panel status-success">
              <span className="status-icon">✓</span>
              <p><strong>Email verification completed</strong></p>
              <p className="subtitle">Your email has been verified successfully.</p>
            </div>

            {isSeller ? (
              <div className="status-panel status-kyc-pending">
                <span className="status-icon">📋</span>
                <p><strong>KYC verification required</strong></p>
                <p className="subtitle">
                  Sign in with your PIN or password, then complete seller KYC onboarding
                  (business details and documents).
                </p>
                <p className="subtitle" style={{ fontSize: 13 }}>
                  After admin approves KYC, you will see a green &quot;KYC completed&quot; status on
                  your dashboard.
                </p>
              </div>
            ) : (
              <div className="status-panel status-info">
                <span className="status-icon">🛒</span>
                <p><strong>Buyer account ready</strong></p>
                <p className="subtitle">Sign in to access your buyer dashboard.</p>
              </div>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                navigate(isSeller ? '/login?verified=seller' : '/login?verified=1')
              }
            >
              Continue to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="status-panel status-error">
              <span className="status-icon">✕</span>
              <p><strong>Verification failed</strong></p>
              <p className="subtitle">{errorMsg}</p>
            </div>
            <p className="signup-footer">
              <Link to="/login">Back to login</Link> · <Link to="/register">Register again</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
