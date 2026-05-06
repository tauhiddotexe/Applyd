import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('applyd_token');
    if (token) {
      authAPI.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('applyd_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('applyd_token', data.access_token);
    const me = await authAPI.me();
    setUser(me);
    return me;
  };

  const signup = async (formData) => {
    const data = await authAPI.signup(formData);
    localStorage.setItem('applyd_token', data.access_token);
    const me = await authAPI.me();
    setUser(me);
    return me;
  };

  const logout = () => {
    localStorage.removeItem('applyd_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
