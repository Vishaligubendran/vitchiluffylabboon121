import { Link } from 'react-router-dom';

export default function KycStatusBanner({ kyc }) {
  if (!kyc) return null;

  const submitted =
    kyc.submittedAt && kyc.documentUrls && Object.keys(kyc.documentUrls).length > 0;

  if (kyc.kycStatus === 'approved') {
    return (
      <div className="status-panel status-success">
        <span className="status-icon">✓</span>
        <div className="kyc-banner-body">
          <p>
            <strong>KYC verified</strong>
          </p>
          <p className="subtitle">Your seller account is verified and active.</p>
          {kyc.shopName && <p className="subtitle">Shop: {kyc.shopName}</p>}
        </div>
      </div>
    );
  }

  if (kyc.kycStatus === 'rejected') {
    return (
      <div className="status-panel status-error">
        <span className="status-icon">✕</span>
        <div className="kyc-banner-body">
          <p>
            <strong>KYC verification failed</strong>
          </p>
          <p className="subtitle">{kyc.rejectionReason || 'Please resubmit your documents.'}</p>
          <Link to="/seller/onboarding" className="btn-primary kyc-action-btn">
            Resubmit KYC verification
          </Link>
        </div>
      </div>
    );
  }

  if (submitted && kyc.kycStatus === 'pending') {
    return (
      <div className="status-panel status-kyc-pending">
        <span className="status-icon">📋</span>
        <div className="kyc-banner-body">
          <p>
            <strong>KYC verification pending</strong>
          </p>
          <p className="subtitle">
            Documents submitted. An admin will review and verify your KYC soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="status-panel status-warn">
      <span className="status-icon">!</span>
      <div className="kyc-banner-body">
        <p>
          <strong>KYC verification required</strong>
        </p>
        <p className="subtitle">
          Complete KYC onboarding (business details and documents) to activate your seller shop.
        </p>
        <Link to="/seller/onboarding" className="btn-primary kyc-action-btn">
          Complete KYC verification
        </Link>
      </div>
    </div>
  );
}
