import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { sellerApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import KycStatusBanner from '../components/KycStatusBanner';
import '../pages/auth/LoginPage.css';

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (location.state?.kycSubmitted) {
      toast.success('KYC submitted — pending admin verification');
      window.history.replaceState({}, document.title);
    }
    if (location.state?.newSeller) {
      toast.success('Welcome! Complete KYC verification to activate your shop.');
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadKyc = () => {
    setLoading(true);
    setLoadError(false);
    sellerApi
      .getKycStatus()
      .then((res) => setKyc(res.data.kyc))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadKyc();
  }, []);

  return (
    <div className="dashboard">
      <header className="dash-header">
        <h1>Seller Dashboard</h1>
        <button type="button" className="btn-secondary" onClick={logout}>
          Logout
        </button>
      </header>
      <p>Welcome, {user?.fullName || user?.username}</p>

      {user?.isEmailVerified && (
        <div className="status-panel status-success" style={{ marginTop: 16 }}>
          <span className="status-icon">✓</span>
          <div className="kyc-banner-body">
            <p>
              <strong>Email verified</strong>
            </p>
            <p className="subtitle">Your Google / email verification is complete.</p>
          </div>
        </div>
      )}

      {loading && <p className="subtitle" style={{ marginTop: 16 }}>Loading KYC status…</p>}

      {loadError && !loading && (
        <div className="status-panel status-error" style={{ marginTop: 16 }}>
          <p>Could not load KYC status.</p>
          <button type="button" className="btn-primary kyc-action-btn" onClick={loadKyc}>
            Retry
          </button>
        </div>
      )}

      {!loading && !loadError && kyc && (
        <div style={{ marginTop: 16 }}>
          <KycStatusBanner kyc={kyc} />
        </div>
      )}

      {!loading && kyc?.kycStatus === 'approved' && (
        <div className="dash-card" style={{ marginTop: 20 }}>
          <p>Your shop is live. You can manage orders and inventory from here.</p>
        </div>
      )}
    </div>
  );
}
