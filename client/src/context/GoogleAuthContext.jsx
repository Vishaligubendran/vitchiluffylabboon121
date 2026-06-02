import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import api from '../services/api';

const GoogleAuthContext = createContext({
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  ready: false,
  enabled: false,
});

export function GoogleAuthProvider({ children }) {
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [clientId, setClientId] = useState(envClientId);
  const [ready, setReady] = useState(Boolean(envClientId));

  useEffect(() => {
    if (envClientId) {
      setClientId(envClientId);
      setReady(true);
      return;
    }

    api
      .get('/auth/config')
      .then((res) => {
        const id = res.data?.googleClientId || '';
        setClientId(id);
      })
      .catch(() => {
        setClientId('');
      })
      .finally(() => setReady(true));
  }, [envClientId]);

  const value = useMemo(
    () => ({
      clientId,
      ready,
      enabled: Boolean(clientId),
    }),
    [clientId, ready]
  );

  const tree = <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>;

  if (!clientId) return tree;

  return (
    <GoogleOAuthProvider clientId={clientId} locale="en">
      {tree}
    </GoogleOAuthProvider>
  );
}

export const useGoogleAuth = () => useContext(GoogleAuthContext);
