import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleExpiredSession = () => setUser(null);
    window.addEventListener('peoplecorps:session-expired', handleExpiredSession);
    if (!getToken()) { setLoading(false); return () => window.removeEventListener('peoplecorps:session-expired', handleExpiredSession); }
    api('/auth/me').then((response) => setUser(response.data)).catch(() => { setToken(null); setUser(null); }).finally(() => setLoading(false));
    return () => window.removeEventListener('peoplecorps:session-expired', handleExpiredSession);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(email, password) {
      const response = await api('/auth/login', { method: 'POST', auth: false, body: { email, password } });
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data.user;
    },
    async logout() {
      try { if (getToken()) await api('/auth/logout', { method: 'POST' }); } catch { /* clear local session even if the API is unavailable */ }
      setToken(null);
      setUser(null);
    },
    updateUser(nextUser) { setUser(nextUser); }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
