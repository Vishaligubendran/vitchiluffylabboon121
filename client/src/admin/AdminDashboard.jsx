import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../services/api';
import { getApiErrorMessage } from '../utils/apiError';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'pending', label: 'Pending KYC', icon: '📋' },
  { id: 'buyers', label: 'Buyers', icon: '🛒' },
  { id: 'sellers', label: 'Sellers', icon: '🏪' },
  { id: 'users', label: 'All Users', icon: '👥' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState('overview');
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [b, s, p, u] = await Promise.all([
        adminApi.getBuyers(),
        adminApi.getSellers(),
        adminApi.getPendingKyc(),
        adminApi.getUsers(),
      ]);
      setBuyers(b.data.buyers || []);
      setSellers(s.data.sellers || []);
      setPending(p.data.pendingKyc || []);
      setAllUsers(u.data.users || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load admin data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (sellerId) => {
    try {
      await adminApi.approveKyc(sellerId);
      toast.success('KYC approved');
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Approve failed'));
    }
  };

  const reject = async (sellerId) => {
    const reason = window.prompt('Rejection reason (required)');
    if (!reason?.trim()) return;
    try {
      await adminApi.rejectKyc(sellerId, reason);
      toast.success('KYC rejected');
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Reject failed'));
    }
  };

  const blockUser = async (userId) => {
    const reason = window.prompt('Block reason (optional)') || '';
    try {
      await adminApi.blockUser(userId, reason);
      toast.success('User blocked');
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Block failed'));
    }
  };

  const activateUser = async (userId) => {
    try {
      await adminApi.activateUser(userId);
      toast.success('User activated');
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Activate failed'));
    }
  };

  const activeBuyers = buyers.filter((u) => u.status === 'active').length;
  const activeSellers = sellers.filter((u) => u.status === 'active').length;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>247 Shop</h2>
          <p>Admin Panel</p>
        </div>
        <nav className="admin-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={section === s.id ? 'active' : ''}
              onClick={() => setSection(s.id)}
            >
              <span className="nav-icon">{s.icon}</span>
              {s.label}
              {s.id === 'pending' && pending.length > 0 && (
                <span className="nav-badge">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <p className="admin-user">{user?.username || 'admin'}</p>
          <button type="button" className="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <h1>{SECTIONS.find((s) => s.id === section)?.label}</h1>
          <button type="button" className="btn-refresh" onClick={load} disabled={loading}>
            Refresh
          </button>
        </header>

        {loading && <p className="admin-loading">Loading...</p>}

        {!loading && section === 'overview' && (
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Buyers</span>
              <span className="stat-value">{buyers.length}</span>
              <span className="stat-sub">{activeBuyers} active</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Sellers</span>
              <span className="stat-value">{sellers.length}</span>
              <span className="stat-sub">{activeSellers} active</span>
            </div>
            <div className="stat-card highlight">
              <span className="stat-label">Pending KYC</span>
              <span className="stat-value">{pending.length}</span>
              <button type="button" className="stat-link" onClick={() => setSection('pending')}>
                Review now →
              </button>
            </div>
            <div className="stat-card">
              <span className="stat-label">All Users</span>
              <span className="stat-value">{allUsers.length}</span>
            </div>
          </div>
        )}

        {!loading && section === 'pending' && (
          <div className="admin-panel">
            <p className="panel-desc">Review seller KYC submissions. Approve or reject with a reason.</p>
            {pending.length === 0 ? (
              <div className="empty-state">No pending KYC submissions.</div>
            ) : (
              pending.map((k) => (
                <KycCard key={k.sellerId} kyc={k} onApprove={approve} onReject={reject} />
              ))
            )}
          </div>
        )}

        {!loading && section === 'buyers' && (
          <div className="admin-panel">
            <p className="panel-desc">Manage buyer accounts — block or activate users.</p>
            <UserTable users={buyers} onBlock={blockUser} onActivate={activateUser} emptyLabel="No buyers registered yet." />
          </div>
        )}

        {!loading && section === 'sellers' && (
          <div className="admin-panel">
            <p className="panel-desc">Manage seller accounts — block or activate users.</p>
            <UserTable users={sellers} onBlock={blockUser} onActivate={activateUser} emptyLabel="No sellers registered yet." />
          </div>
        )}

        {!loading && section === 'users' && (
          <div className="admin-panel">
            <p className="panel-desc">All platform users (buyers, sellers, admins).</p>
            <UserTable
              users={allUsers.filter((u) => u.role !== 'admin')}
              onBlock={blockUser}
              onActivate={activateUser}
              showRole
              emptyLabel="No users found."
            />
          </div>
        )}
      </main>
    </div>
  );
}

function KycCard({ kyc, onApprove, onReject }) {
  const docs = kyc.documentUrls || {};
  const docLabels = {
    aadhaarImage: 'Aadhaar',
    panImage: 'PAN',
    gstCertificate: 'GST',
    addressProof: 'Address proof',
    ownerPhoto: 'Owner photo',
    shopPhoto: 'Shop photo',
  };

  return (
    <div className="kyc-card">
      <div className="kyc-card-header">
        <div>
          <h3>{kyc.shopName || kyc.businessName}</h3>
          <p className="kyc-meta">
            {kyc.businessType} · {kyc.ownerName} · {kyc.mobile}
          </p>
        </div>
        <span className="status-pill pending">Pending</span>
      </div>
      <div className="kyc-details">
        <p><strong>Location:</strong> {kyc.area}, {kyc.state} {kyc.pincode}</p>
        <p><strong>Address:</strong> {kyc.address}</p>
        <p><strong>GSTIN:</strong> {kyc.gstin} · <strong>PAN:</strong> {kyc.panNumber}</p>
        <p><strong>Coords:</strong> {kyc.latitude}, {kyc.longitude}</p>
      </div>
      {Object.keys(docs).length > 0 && (
        <div className="kyc-docs">
          {Object.entries(docs).map(([key, url]) => (
            <a
              key={key}
              href={url.startsWith('http') ? url : `${window.location.origin}${url}`}
              target="_blank"
              rel="noreferrer"
              className="doc-link"
            >
              {docLabels[key] || key}
            </a>
          ))}
        </div>
      )}
      <div className="row-actions">
        <button type="button" className="btn-approve" onClick={() => onApprove(kyc.sellerId)}>
          Approve KYC
        </button>
        <button type="button" className="btn-reject" onClick={() => onReject(kyc.sellerId)}>
          Reject KYC
        </button>
      </div>
    </div>
  );
}

function UserTable({ users, onBlock, onActivate, showRole, emptyLabel }) {
  if (!users.length) {
    return <div className="empty-state">{emptyLabel}</div>;
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Mobile</th>
            {showRole && <th>Role</th>}
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.uid}>
              <td>{u.fullName || '—'}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.mobile || '—'}</td>
              {showRole && <td><span className={`role-pill ${u.role}`}>{u.role}</span></td>}
              <td>
                <span className={`status-pill ${u.status}`}>{u.status}</span>
              </td>
              <td>
                {u.status === 'blocked' ? (
                  <button type="button" className="btn-sm btn-approve" onClick={() => onActivate(u.uid)}>
                    Activate
                  </button>
                ) : (
                  <button type="button" className="btn-sm btn-reject" onClick={() => onBlock(u.uid)}>
                    Block
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
