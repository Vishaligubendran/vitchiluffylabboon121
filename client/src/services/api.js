import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

if (import.meta.env.DEV) {
  api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 400) {
        console.error('[API 400]', err.config?.url, err.response?.data);
      }
      return Promise.reject(err);
    }
  );
}

/** Shared authentication (all roles) */
export const authApi = {
  getConfig: () => api.get('/auth/config'),
  loginPin: (pin) => api.post('/auth/login-pin', { pin }),
  loginPassword: (identifier, password) =>
    api.post('/auth/login-password', { identifier, password }),
  loginGoogle: (idToken) => api.post('/auth/login-google', { idToken }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  sendVerification: (email) => api.post('/auth/send-verification', { email }),
  requestReset: (email) => api.post('/auth/request-reset', { email }),
  resetCredentials: (data) => api.post('/auth/reset-credentials', data),
  getMe: () => api.get('/auth/me'),
};

/** Buyer */
export const buyerApi = {
  register: (data) => api.post('/auth/register-buyer', data),
  registerGoogle: (data) => api.post('/auth/register-buyer-google', data),
  getProfile: () => api.get('/buyer/profile'),
};

/** Seller */
export const sellerApi = {
  register: (data) => api.post('/auth/register-seller', data),
  registerGoogle: (data) => api.post('/auth/register-seller-google', data),
  getProfile: () => api.get('/seller/profile'),
  getKycStatus: () => api.get('/seller/kyc-status'),
  submitKyc: (formData) => api.post('/seller/upload-kyc', formData),
};

/** Admin */
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  getBuyers: () => api.get('/admin/buyers'),
  getSellers: () => api.get('/admin/sellers'),
  getPendingKyc: () => api.get('/admin/pending-kyc'),
  approveKyc: (id) => api.put(`/admin/approve-kyc/${id}`),
  rejectKyc: (id, reason) => api.put(`/admin/reject-kyc/${id}`, { reason }),
  blockUser: (id, reason) => api.put(`/admin/block-user/${id}`, { reason }),
  activateUser: (id) => api.put(`/admin/activate-user/${id}`),
};

/** Location helpers (seller onboarding) */
export const locationApi = {
  getPincode: (pincode) => api.get(`/location/pincode/${pincode}`),
  reverseGeocode: (lat, lng) => api.get('/location/reverse', { params: { lat, lng } }),
};

// Backward-compatible aliases used by auth pages
authApi.registerBuyer = buyerApi.register;
authApi.registerSeller = sellerApi.register;

export default api;
