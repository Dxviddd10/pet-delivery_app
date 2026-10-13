import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { email: string; password: string; fullName: string; phone: string }) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(async ({ email, password, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(() => ({ session, loading, signIn, signUp, signOut }), [session, loading, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
