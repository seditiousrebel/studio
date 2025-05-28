"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ADMIN_EMAIL } from '@/lib/constants';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import type { Database } from '@/types/supabase';
import { createBrowserClient } from '@supabase/ssr';

export type UserVoteValue = 'up' | 'down' | null;
export type ItemType = 'politician' | 'party' | 'promise' | 'bill';

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  supabase: ReturnType<typeof createBrowserClient<Database>>;
  isLoadingAuth: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  userEmail: string | null;
  userVotes: Record<string, UserVoteValue>;
  castVote: (itemId: string, itemType: ItemType, voteType: 'up' | 'down' | null) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AppProvidersProps {
  children: ReactNode;
}

const USER_VOTES_STORAGE_KEY = 'NetaTrackUserVotes';

export function AppProviders({ children }: AppProvidersProps) {
  const [supabase] = useState(() => createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  const router = useRouter();
  const pathname = usePathname();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, UserVoteValue>>({});
  const [profileIsAdmin, setProfileIsAdmin] = useState(false);

  const isAuthenticated = !!session;
  const isAdmin = isAuthenticated && (profileIsAdmin || (!!userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()));

  const fetchAndSetUserProfile = useCallback(async (currentUser: SupabaseUser | null) => {
    if (currentUser) {
      console.log(`[AppProviders] Fetching profile for user ID: ${currentUser.id}, email: ${currentUser.email}`);
      const { data: profile, error } = await supabase
        .from('users') // Changed from 'profiles' to 'users'
        .select('role, email, full_name, avatar_asset_id') // Changed select fields
        .eq('id', currentUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { 
        console.error("[AppProviders] Error fetching user profile:", error);
        setProfileIsAdmin(false);
      } else if (profile) {
        console.log("[AppProviders] Profile fetched:", { 
          userId: currentUser.id,
          profileEmail: profile.email, 
          profileFullName: profile.full_name,
          profileRole: profile.role // Changed from profileIsAdminDb: profile.is_admin
        });
        setProfileIsAdmin(profile.role === 'Admin'); // Changed logic to use profile.role
      } else {
        console.warn(`[AppProviders] No profile found in 'users' table for user ID: ${currentUser.id} (auth email: ${currentUser.email}). This can happen if the profile row wasn't created after signup. Admin status from DB will be false.`);
        setProfileIsAdmin(false);
      }
    } else {
      setProfileIsAdmin(false);
    }
  }, [supabase]);


  useEffect(() => {
    const getInitialSessionAndProfile = async () => {
      setIsLoadingAuth(true);
      console.log("[AppProviders] Attempting to get initial session...");
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("[AppProviders] Error getting initial session:", sessionError);
      }
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      setUserEmail(currentUser?.email || null);
      console.log("[AppProviders] Initial session state:", currentSession ? "Session found" : "No session", "User:", currentUser?.email);

      await fetchAndSetUserProfile(currentUser);
      setIsLoadingAuth(false);
    };

    getInitialSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, sessionState) => {
      console.log("[AppProviders] Auth state changed:", event, "Session active:", !!sessionState);
      setSession(sessionState);
      const currentUser = sessionState?.user ?? null;
      setUser(currentUser);
      setUserEmail(currentUser?.email || null);
      
      await fetchAndSetUserProfile(currentUser);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        router.refresh();
      }
      if (event === 'SIGNED_OUT') {
        setUserVotes({});
        localStorage.removeItem(USER_VOTES_STORAGE_KEY);
        // profileIsAdmin is handled by fetchAndSetUserProfile(null)
        router.refresh();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router, fetchAndSetUserProfile]);

  useEffect(() => {
    if (isAuthenticated) {
      try {
        const storedVotes = localStorage.getItem(USER_VOTES_STORAGE_KEY);
        if (storedVotes) {
          setUserVotes(JSON.parse(storedVotes));
        }
      } catch (e) {
        console.error("Error parsing stored user votes:", e);
        localStorage.removeItem(USER_VOTES_STORAGE_KEY);
      }
    } else {
      setUserVotes({});
    }
  }, [isAuthenticated]);

  const logout = useCallback(async () => {
    console.log("[AppProviders] Logging out...");
    await supabase.auth.signOut();
  }, [supabase]);

  const castVote = useCallback((itemId: string, itemType: ItemType, newVoteAction: 'up' | 'down' | null) => {
    if (!session) {
      console.warn("User not authenticated, cannot cast vote. Redirecting to login.");
      router.push(`/login?redirectTo=${pathname}`);
      return;
    }

    const voteKey = `${itemType}-${itemId}`;
    
    setUserVotes(prevVotes => {
      const oldVote = prevVotes[voteKey] || null;
      let actualNewVote: UserVoteValue;

      if (oldVote === newVoteAction) {
        actualNewVote = null;
      } else {
        actualNewVote = newVoteAction;
      }
      const updatedVotes = { ...prevVotes, [voteKey]: actualNewVote };
      localStorage.setItem(USER_VOTES_STORAGE_KEY, JSON.stringify(updatedVotes));
      return updatedVotes;
    });
    
  }, [session, router, pathname]); // Removed userVotes from here as setUserVotes handles prevVotes

  useEffect(() => {
    if (!isLoadingAuth) {
      console.log("[AppProviders] Final isAdmin status:", isAdmin, "{isAuthenticated:", isAuthenticated, ", profileIsAdmin(DB):", profileIsAdmin, ", userEmailMatchesADMIN_EMAIL:", (!!userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()),"}");
    }
  }, [isAdmin, isLoadingAuth, isAuthenticated, profileIsAdmin, userEmail]);

  const authContextValue = useMemo(() => ({
    session, user, supabase, isLoadingAuth, isAdmin, logout, userEmail, userVotes, castVote, isAuthenticated
  }), [session, user, supabase, isLoadingAuth, isAdmin, logout, userEmail, userVotes, castVote, isAuthenticated]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}
