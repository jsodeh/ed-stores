import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth, profiles } from '@/lib/supabase';
import { UserProfile, UserRole } from '@shared/database.types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AuthContext: Auth state change event:', event, session ? 'Session exists' : 'No session');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 AuthContext: User signed in, loading profile');
          await loadUserProfile(session.user.id);
        } else {
          console.log('🚪 AuthContext: User signed out, clearing profile');
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await profiles.getProfile(userId);
      if (error) {
        console.error('Error loading profile:', error);
        return;
      }
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const result = await auth.signUp(email, password, fullName);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await auth.signIn(email, password);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      console.log('🚪 AuthContext: Starting sign out process');
      await auth.signOut();
      console.log('✅ AuthContext: Sign out successful');
    } catch (error) {
      console.error('❌ AuthContext: Error during sign out:', error);
    } finally {
      // Ensure local state is cleared
      setUser(null);
      setProfile(null);
      setSession(null);

      // Aggressively clear any persisted Supabase auth tokens from storage
      try {
        if (typeof window !== 'undefined') {
          const clear = (storage: Storage) => {
            const keys: string[] = [];
            for (let i = 0; i < storage.length; i++) {
              const k = storage.key(i);
              if (!k) continue;
              if (k.startsWith('sb-') || k.includes('supabase') || k === 'sb-public') {
                keys.push(k);
              }
            }
            keys.forEach(k => storage.removeItem(k));
          };
          clear(window.localStorage);
          clear(window.sessionStorage);
        }
      } catch (e) {
        console.warn('Auth storage clear warning:', e);
      }

      setLoading(false);

      // Hard redirect to home to ensure clean app state
      if (typeof window !== 'undefined') {
        window.location.assign('/');
      }
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user logged in' };
    
    try {
      const result = await profiles.updateProfile(user.id, updates);
      if (result.data) {
        setProfile(result.data);
      }
      return result;
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const value = {
    user,
    profile,
    session,
    loading,
    isAuthenticated,
    isAdmin,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth guard component
export function AuthGuard({ 
  children, 
  fallback = null,
  requireAuth = true,
  requireAdmin = false 
}: { 
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return fallback || <div>Please sign in to access this page.</div>;
  }

  if (requireAdmin && !isAdmin) {
    return fallback || <div>Access denied. Admin privileges required.</div>;
  }

  return <>{children}</>;
}
