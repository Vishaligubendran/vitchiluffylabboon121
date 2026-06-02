import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi, locationApi, sellerApi } from '../services/api';
import { getApiErrorMessage } from '../utils/apiError';
import { useAuth } from '../context/AuthContext';
import DocumentUpload from '../components/DocumentUpload';
import ShopMap from '../components/ShopMap';
import { BUSINESS_TYPES, INDIAN_STATES } from '../utils/constants';
import './SellerOnboarding.css';

const DEFAULT_LAT = 13.0827;
const DEFAULT_LNG = 80.2707;

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [form, setForm] = useState({
    businessName: '',
    businessType: 'Supplier',
    shopName: '',
    email: '',
    mobile: '',
    ownerName: '',
    is24x7: false,
    state: 'Tamil Nadu',
    pincode: '',
    area: '',
    address: '',
    aadhaarNumber: '',
    panNumber: '',
    gstin: '',
  });
  const [files, setFiles] = useState({
    aadhaarImage: null,
    panImage: null,
    gstCertificate: null,
    addressProof: null,
    ownerPhoto: null,
    shopPhoto: null,
  });

  useEffect(() => {
    const prefill = async () => {
      try {
        const res = await authApi.getMe();
        const profile = res.data.user;
        setForm((f) => ({
          ...f,
          email: profile.email || f.email,
          mobile: profile.mobile || f.mobile,
          ownerName: profile.fullName || f.ownerName,
          shopName: f.shopName || profile.fullName || '',
        }));
      } catch {
        if (user) {
          setForm((f) => ({
            ...f,
            email: user.email || f.email,
            mobile: user.mobile || f.mobile,
            ownerName: user.fullName || f.ownerName,
            shopName: f.shopName || user.fullName || '',
          }));
        }
      }
    };
    prefill();
  }, [user]);

  useEffect(() => {
    if (form.pincode.length !== 6) {
      setAreas([]);
      return undefined;
    }

    let cancelled = false;
    setPincodeLoading(true);

    locationApi
      .getPincode(form.pincode)
      .then((res) => {
        if (cancelled) return;
        const list = res.data.areas || [];
        setAreas(list);
        if (res.data.state) {
          setForm((f) => ({
            ...f,
            state: INDIAN_STATES.includes(res.data.state) ? res.data.state : f.state,
            area: list.includes(f.area) ? f.area : '',
          }));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setAreas([]);
          toast.error(err.response?.data?.message || 'Could not load areas for pincode');
        }
      })
      .finally(() => {
        if (!cancelled) setPincodeLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.pincode]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setFile = (key, file) => setFiles((f) => ({ ...f, [key]: file }));

  const applyReverseGeocode = async (latitude, longitude) => {
    try {
      const res = await locationApi.reverseGeocode(latitude, longitude);
      const loc = res.data.location;
      setForm((f) => ({
        ...f,
        state: loc.state && INDIAN_STATES.includes(loc.state) ? loc.state : f.state,
        pincode: loc.pincode?.slice(0, 6) || f.pincode,
        area: loc.area || f.area,
        address: loc.address || f.address,
      }));
      if (loc.pincode?.length === 6) {
        toast.success('Address details updated from map location');
      }
    } catch {
      toast.success('Location updated on map');
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        await applyReverseGeocode(latitude, longitude);
      },
      () => toast.error('Could not get location')
    );
  };

  const handleMapMove = async (newLat, newLng) => {
    setLat(newLat);
    setLng(newLng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missingFiles = Object.entries(files).filter(([, f]) => !f).map(([k]) => k);
    if (missingFiles.length) {
      toast.error(`Upload all documents: ${missingFiles.join(', ')}`);
      return;
    }
    if (!form.area && areas.length) set('area', areas[0]);
    if (!form.area) {
      toast.error('Please select an area (enter valid 6-digit pincode first)');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, k === 'is24x7' ? String(v) : v);
      });
      fd.append('latitude', String(lat));
      fd.append('longitude', String(lng));
      Object.entries(files).forEach(([k, file]) => {
        if (file) fd.append(k, file);
      });
      await sellerApi.submitKyc(fd);
      toast.success('KYC submitted successfully');
      navigate('/seller', { state: { kycSubmitted: true } });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'KYC submission failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-layout">
      <aside className="onboarding-sidebar">
        <h2>Grow Your Business</h2>
        <p>Complete the form to start selling on NammaLocal. You&apos;ll need:</p>
        <ul>
          <li>✓ Business Details</li>
          <li>✓ Shop Location</li>
          <li>✓ KYC Documents</li>
        </ul>
      </aside>

      <main className="onboarding-main">
        <div className="onboarding-topbar">
          <Link to="/seller" className="onboarding-back-btn">
            ← Back to dashboard
          </Link>
          <p className="onboarding-tag">Seller Onboarding</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field full">
            <label>Legal Business/Trade Name *</label>
            <input className="form-input" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} required />
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Business Type *</label>
              <select className="form-input" value={form.businessType} onChange={(e) => set('businessType', e.target.value)}>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Shop Name (Publicly Visible) *</label>
              <input className="form-input" value={form.shopName} onChange={(e) => set('shopName', e.target.value)} required />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Email ID *</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>
            <div className="field">
              <label>Mobile Number (10 digits) *</label>
              <input className="form-input" maxLength={10} value={form.mobile} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, ''))} required />
            </div>
          </div>

          <div className="field full">
            <label>Owner Full Name (Aadhar) *</label>
            <input className="form-input" value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} required />
          </div>

          <div className="toggle-box">
            <div>
              <strong>24/7 Available</strong>
              <p>Switch on if your shop is always open for business</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={form.is24x7} onChange={(e) => set('is24x7', e.target.checked)} />
              <span className="slider" />
            </label>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>State *</label>
              <select className="form-input" value={form.state} onChange={(e) => set('state', e.target.value)}>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Pincode *</label>
              <input className="form-input" maxLength={6} value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} required />
            </div>
          </div>

          <div className="field full">
            <label>Area *</label>
            <select
              className="form-input"
              value={form.area}
              onChange={(e) => set('area', e.target.value)}
              required
              disabled={form.pincode.length !== 6 || pincodeLoading}
            >
              <option value="">
                {pincodeLoading
                  ? 'Loading areas...'
                  : form.pincode.length === 6
                    ? areas.length
                      ? 'Select area'
                      : 'No areas found — check pincode'
                    : 'Enter Valid Pincode First'}
              </option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="field full">
            <label>Business / Shop address</label>
            <textarea className="form-input" rows={3} value={form.address} onChange={(e) => set('address', e.target.value)} required />
          </div>

          <ShopMap
            lat={lat}
            lng={lng}
            onPositionChange={handleMapMove}
            onUseMyLocation={useMyLocation}
          />

          <div className="grid-2 kyc-row">
            <div className="field">
              <label>Aadhar Number (12 digits) *</label>
              <input className="form-input" maxLength={12} value={form.aadhaarNumber} onChange={(e) => set('aadhaarNumber', e.target.value.replace(/\D/g, ''))} required />
            </div>
            <DocumentUpload file={files.aadhaarImage} onChange={(f) => setFile('aadhaarImage', f)} />
          </div>

          <div className="grid-2 kyc-row">
            <div className="field">
              <label>PAN Number *</label>
              <input className="form-input" value={form.panNumber} onChange={(e) => set('panNumber', e.target.value.toUpperCase())} required />
            </div>
            <DocumentUpload file={files.panImage} onChange={(f) => setFile('panImage', f)} />
          </div>

          <div className="grid-2 kyc-row">
            <div className="field">
              <label>GSTIN *</label>
              <input className="form-input" value={form.gstin} onChange={(e) => set('gstin', e.target.value.toUpperCase())} required />
              <DocumentUpload label="" file={files.gstCertificate} onChange={(f) => setFile('gstCertificate', f)} />
            </div>
            <div className="field">
              <label>Address Proof (Utility/Tax) *</label>
              <DocumentUpload file={files.addressProof} onChange={(f) => setFile('addressProof', f)} />
            </div>
          </div>

          <div className="grid-2 kyc-row">
            <div className="field">
              <label>Owner Photo *</label>
              <DocumentUpload
                file={files.ownerPhoto}
                onChange={(f) => setFile('ownerPhoto', f)}
                useFrontCamera
              />
            </div>
            <div className="field">
              <label>Shop/Business *</label>
              <DocumentUpload file={files.shopPhoto} onChange={(f) => setFile('shopPhoto', f)} />
            </div>
          </div>

          <button type="submit" className="btn-blue submit-kyc" disabled={loading}>
            {loading ? 'Submitting...' : 'Complete & Submit'}
          </button>
        </form>
      </main>
    </div>
  );
}
