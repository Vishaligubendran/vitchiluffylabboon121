import { useAuth } from '../context/AuthContext';
import '../pages/auth/LoginPage.css';

export default function BuyerDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dash-header">
        <h1>Buyer Dashboard</h1>
        <button type="button" className="btn-secondary" onClick={logout}>
          Logout
        </button>
      </header>
      <p>Welcome, {user?.fullName || user?.username}</p>

      {user?.isEmailVerified && (
        <div className="status-panel status-success">
          <span className="status-icon">✓</span>
          <div>
            <p><strong>Email verification completed</strong></p>
            <p className="subtitle">Your buyer account is active.</p>
          </div>
        </div>
      )}

      <div className="dash-card">
        <p>Email: {user?.email}</p>
        <p>Status: {user?.status}</p>
      </div>
    </div>
  );
}
