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
  checkUserByEmail: (email: string) => Promise<any>; // Add this line
  loadUserProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Debug function to check user by email
  const checkUserByEmail = async (email: string) => {
    try {
      console.log('🔍 AuthContext: Checking user by email:', email);

      // Check in user_profiles table (public schema)
      const { data: userProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email);

      console.log('🔍 AuthContext: User profiles result:', { userProfiles, profileError });

      return {
        userProfiles,
        profileError
      };
    } catch (error) {
      console.error('❌ AuthContext: Error checking user by email:', error);
      return { error };
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Get initial session with better error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('AuthContext: Session error:', error);
          // Handle refresh token errors by clearing the session
          if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found')) {
            console.log('🔄 AuthContext: Clearing invalid session due to refresh token error');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await loadUserProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('AuthContext: Error getting initial session:', error);
        // Clear session on any error to prevent stuck states
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 AuthContext: Auth state changed:', event, session?.user?.id);
        
        // Handle specific auth events
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserProfile(session.user.id);
          } else {
            setProfile(null);
          }
        } else if (event === 'SIGNED_IN') {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await loadUserProfile(session.user.id);
          }
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Loading profile for user:', userId);
      const { data, error } = await profiles.getProfile(userId);
      console.log('AuthContext: Profile loaded:', { data, error });
      
      if (error) {
        console.error('AuthContext: Error loading profile:', error);
        setProfile(null);
        return;
      }

      setProfile(data);
      
      // Store admin status for persistence
      if (data?.role && (data.role === 'admin' || data.role === 'super_admin')) {
        localStorage.setItem('userIsAdmin', 'true');
        localStorage.setItem('userRole', data.role);
      } else {
        localStorage.removeItem('userIsAdmin');
        localStorage.removeItem('userRole');
      }
    } catch (error) {
      console.error('AuthContext: Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
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

      // Only redirect to home if we're actually signing out, not on page reload
      // Check if we're in a sign out event by checking if there was a user before
      // This prevents redirecting on page reloads when there was no active session
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
  // More robust isAdmin calculation with fallback during loading
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' ||
    (loading && isAuthenticated && localStorage.getItem('userIsAdmin') === 'true');

  // Clean up localStorage when profile changes
  useEffect(() => {
    if (profile?.role && (profile.role === 'admin' || profile.role === 'super_admin')) {
      localStorage.setItem('userIsAdmin', 'true');
      localStorage.setItem('userRole', profile.role);
    } else if (profile && profile.role !== 'admin' && profile.role !== 'super_admin') {
      localStorage.removeItem('userIsAdmin');
      localStorage.removeItem('userRole');
    }
  }, [profile?.role]);

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
    checkUserByEmail,
    loadUserProfile,
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
  const { isAuthenticated, isAdmin, loading, user, profile } = useAuth();

  // Add timeout for loading state to prevent infinite loops
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 3000); // Reduced to 3 seconds
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}