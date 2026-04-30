import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { getSafeSession } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const bootstrapped = useRef(false);

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

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
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
        const { data: { session: s } } = await getSafeSession();
        if (mounted && s) commitSession(s);
      } catch (err) {
        console.error('[Auth] Bootstrap:', err);
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
  }, [commitSession]);

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

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
