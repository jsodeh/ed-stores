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
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔄 AuthContext: Getting initial session');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔄 AuthContext: Initial session result:', session ? 'Session exists' : 'No session');
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('👤 AuthContext: Loading profile for user:', session.user.id);
        await loadUserProfile(session.user.id);
      } else {
        console.log('👤 AuthContext: No user in session, skipping profile load');
        // Ensure loading is set to false even when no user
        setLoading(false);
      }

      console.log('✅ AuthContext: Initial session loading complete');
    };

    console.log('🔄 AuthContext: useEffect triggered');
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 AuthContext: Auth state change event:', event, session ? 'Session exists' : 'No session');
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('👤 AuthContext: User signed in, loading profile for user:', session.user.id);
          await loadUserProfile(session.user.id);
        } else {
          console.log('🚪 AuthContext: User signed out, clearing profile');
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🧹 AuthContext: Unsubscribing from auth state changes');
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('👤 AuthContext: Loading profile for user:', userId);
      const { data, error } = await profiles.getProfile(userId);
      console.log('👤 AuthContext: Profile data received:', { data, error });
      if (error) {
        console.error('❌ AuthContext: Error loading profile:', error);
        setProfile(null);
        return;
      }
      console.log('✅ AuthContext: Profile loaded for user:', userId, data);

      // Additional debugging for role verification
      if (data?.role) {
        console.log('📋 AuthContext: Profile role verification:', {
          role: data.role,
          roleType: typeof data.role,
          isAdmin: data.role === 'admin' || data.role === 'super_admin',
          isSuperAdmin: data.role === 'super_admin'
        });
      } else {
        console.warn('⚠️ AuthContext: Profile loaded but role is missing or null:', data);
      }

      setProfile(data);
      // Log the role directly after setting it
      console.log('📋 AuthContext: Profile role after setting:', data?.role);
    } catch (error) {
      console.error('❌ AuthContext: Error loading profile:', error);
      setProfile(null);
    } finally {
      // Always set loading to false after profile loading attempt
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

  // Store admin status in localStorage for persistence across reloads
  useEffect(() => {
    if (profile?.role && (profile.role === 'admin' || profile.role === 'super_admin')) {
      localStorage.setItem('userIsAdmin', 'true');
      localStorage.setItem('userRole', profile.role);
    } else if (profile && profile.role !== 'admin' && profile.role !== 'super_admin') {
      localStorage.removeItem('userIsAdmin');
      localStorage.removeItem('userRole');
    }
  }, [profile?.role]);

  // Additional debugging for role checking
  console.log('🔐 AuthContext: Role checking details', {
    profileRole: profile?.role,
    profileRoleType: typeof profile?.role,
    profileRoleIsNull: profile?.role === null,
    profileRoleIsUndefined: profile?.role === undefined,
    isAdminCheck1: profile?.role === 'admin',
    isAdminCheck2: profile?.role === 'super_admin',
    finalIsAdmin: isAdmin,
    storedAdminStatus: localStorage.getItem('userIsAdmin'),
    storedRole: localStorage.getItem('userRole')
  });

  // Debug logging - moved to useEffect to reduce console spam
  useEffect(() => {
    console.log('🔐 AuthContext: isAdmin calculation', {
      profileRole: profile?.role,
      profileId: profile?.id,
      isAdmin,
      isSuperAdmin: profile?.role === 'super_admin',
      profileExists: !!profile,
      userExists: !!user,
      // Add more detailed debugging
      profileData: profile,
      userObject: user,
      // Add timestamp for debugging
      timestamp: new Date().toISOString()
    });
  }, [profile, user, isAdmin]);

  // Add a force refresh mechanism for debugging
  const forceRefreshProfile = async () => {
    if (user?.id) {
      console.log('🔄 AuthContext: Force refreshing profile for user:', user.id);
      await loadUserProfile(user.id);
    }
  };

  // Make forceRefreshProfile available globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).forceRefreshProfile = forceRefreshProfile;
    }
  }, [user]);

  // Track isAdmin changes
  useEffect(() => {
    console.log('🔄 AuthContext: isAdmin changed to:', isAdmin);
    // Force a re-render if isAdmin is true but components aren't updating
    if (isAdmin) {
      console.log('🎉 AuthContext: Admin access confirmed - forcing update');
    }
  }, [isAdmin]);

  // Debug profile changes
  useEffect(() => {
    console.log('🔄 AuthContext: Profile state changed:', profile);
  }, [profile]);

  // Debug user changes
  useEffect(() => {
    console.log('🔄 AuthContext: User state changed:', user);
  }, [user]);

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

  // Debug logging for AuthGuard
  console.log('🛡️ AuthGuard: State check', {
    loading,
    isAuthenticated,
    isAdmin,
    requireAuth,
    requireAdmin,
    hasUser: !!user,
    hasProfile: !!profile,
    profileRole: profile?.role
  });

  // Add timeout for loading state to prevent infinite loops
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.warn('⚠️ AuthGuard: Loading timeout reached, forcing continue');
        setLoadingTimeout(true);
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-sm text-gray-500 mt-2">Checking authentication status</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    console.log('🛡️ AuthGuard: Authentication required but user not authenticated');
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
    console.log('🛡️ AuthGuard: Admin access required but user is not admin', {
      isAdmin,
      profileRole: profile?.role,
      isAuthenticated
    });
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  console.log('✅ AuthGuard: Access granted, rendering children');

  return <>{children}</>;
}