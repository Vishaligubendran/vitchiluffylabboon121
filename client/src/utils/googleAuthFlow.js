import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { getApiErrorMessage } from './apiError';
import { redirectByRole } from './authRedirect';
import { parseGoogleIdToken, saveGooglePending } from './googleAuth';

/**
 * Existing Google account → sign in and redirect.
 * New Google account → save token and go to buyer/seller choice page.
 */
export async function handleGoogleAuthResult({ idToken, login, navigate }) {
  try {
    const res = await authApi.loginGoogle(idToken);
    login(res.data);
    toast.success('Signed in with Google');
    await redirectByRole(navigate, res.data.user);
    return { status: 'existing' };
  } catch (err) {
    if (err.response?.status !== 404) {
      toast.error(getApiErrorMessage(err, 'Google sign-in failed'));
      return { status: 'error' };
    }

    try {
      const profile = parseGoogleIdToken(idToken);
      saveGooglePending({ idToken, ...profile });
      navigate('/auth/google-continue');
      return { status: 'new' };
    } catch {
      toast.error('Could not read Google profile. Try again.');
      return { status: 'error' };
    }
  }
}
