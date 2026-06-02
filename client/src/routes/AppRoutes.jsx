import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  GoogleContinuePage,
  VerifyEmailPage,
  ResetPage,
  ResetCredentialsPage,
} from '../pages/auth';
import { BuyerDashboard } from '../buyer';
import { SellerDashboard, SellerOnboarding } from '../seller';
import { AdminDashboard } from '../admin';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/google-continue" element={<GoogleContinuePage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset" element={<ResetPage />} />
      <Route path="/reset-credentials" element={<ResetCredentialsPage />} />

      <Route
        path="/buyer"
        element={
          <ProtectedRoute role="buyer">
            <BuyerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller"
        element={
          <ProtectedRoute role="seller">
            <SellerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/onboarding"
        element={
          <ProtectedRoute role="seller">
            <SellerOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
