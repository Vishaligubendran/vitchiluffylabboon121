export function parseGoogleIdToken(idToken) {
  const payload = JSON.parse(atob(idToken.split('.')[1]));
  return {
    email: (payload.email || '').toLowerCase(),
    fullName: payload.name || '',
    picture: payload.picture || null,
  };
}

const STORAGE_KEY = 'googlePendingAuth';

export function saveGooglePending(data) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadGooglePending() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearGooglePending() {
  sessionStorage.removeItem(STORAGE_KEY);
}
