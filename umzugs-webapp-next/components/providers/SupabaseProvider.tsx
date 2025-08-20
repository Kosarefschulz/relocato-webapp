'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface SupabaseContextType {
  supabase: SupabaseClient | null;
  user: any | null;
  loading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  user: null,
  loading: true,
});

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not configured');
      setLoading(false);
      return;
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    setSupabase(supabaseClient);

    // Check active session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      // Handle auth events
      if (_event === 'SIGNED_IN') {
        router.refresh();
      } else if (_event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <SupabaseContext.Provider value={{ supabase, user, loading }}>
      {children}
    </SupabaseContext.Provider>
  );
}