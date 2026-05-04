import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getSafeSession, userAPI } from '../services/api';

const defaultAuthContext = {
  user: null,
  profile: null,
  session: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  refreshProfile: async () => {}
};

const AuthContext = createContext(defaultAuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const bootstrapped = useRef(false);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await userAPI.getProfile();
      setProfile(data);
      return data;
    } catch (err) {
      console.error('[AuthContext] Profile fetch failed:', err);
      return null;
    }
  }, []);

  // Stable user update — only change ref if user.id changes
  const commitSession = useCallback((s) => {
    setSession(s);
    setUser((prev) => {
      const nid = s?.user?.id ?? null;
      const oid = prev?.id ?? null;
      if (nid === oid && prev) return prev;
      return s?.user ?? null;
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  useEffect(() => {
    if (user?.id) {
      refreshProfile();
    }
  }, [user?.id, refreshProfile]);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      // During bootstrap, skip only INITIAL_SESSION.
      // SIGNED_IN and TOKEN_REFRESHED must always commit immediately.
      if (!bootstrapped.current && event === 'INITIAL_SESSION') return;

      if (s) commitSession(s);
    });

    // Bootstrap: getSafeSession → THEN set user + loading=false
    // NO manual refreshSession here. Let api.js handle refresh locks.
    (async () => {
      try {
        const { data: { session: s }, error: se } = await getSafeSession();
        if (se) throw se;

        if (mounted && s) {
          commitSession(s);
          const p = await refreshProfile();
          if (!p) {
            // Profile fetch failed usually means the backend rejected the session
            // even if Supabase client thinks it's valid (e.g. JWT verification issue)
            console.warn('[Auth] Profile fetch failed during bootstrap, signing out');
            await logout();
          }
        }
      } catch (err) {
        console.error('[Auth] Bootstrap Error:', err);
        if (mounted) await logout();
      } finally {
        if (mounted) {
          bootstrapped.current = true;
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [commitSession, refreshProfile, logout]);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: name } },
    });
    if (error) throw new Error(error.message);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, login, signup, logout, refreshProfile, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth must be used within an AuthProvider');
    return defaultAuthContext;
  }
  return context;
};
