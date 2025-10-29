import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Rank } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { INITIAL_RANKS } from '../constants';
import { getSupabaseClient } from '../supabaseClient';
// FIX: Removed import of AuthChangeEvent and Session as they are causing errors, likely due to an older SDK version.
// import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  ranks: Rank[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  hasFetchedAllUsers: boolean;
  setHasFetchedAllUsers: React.Dispatch<React.SetStateAction<boolean>>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  addExp: (amount: number) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  updateUserByAdmin: (userId: string, updates: Partial<Pick<User, 'username' | 'role' | 'customTitle' | 'customTitleColor' | 'avatarUrl'>>) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<Pick<User, 'username' | 'avatarUrl'>>) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  updateRanks: (newRanks: Rank[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [hasFetchedAllUsers, setHasFetchedAllUsers] = useState(false);
  const [ranks, setRanks] = useLocalStorage<Rank[]>('app-ranks-v2-exp', INITIAL_RANKS);

  useEffect(() => {
    const supabase = getSupabaseClient();
    
    // --- ARCHITECTURAL FIX: MANUAL SESSION RESTORATION ---
    // With `persistSession: false`, we must manually restore the session.
    // This process is wrapped in a try/catch to be completely safe against corrupted data.
    try {
      let sessionDataRaw = null;
      let sessionKey = null;

      // 1. Find the session key in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          sessionKey = key;
          break;
        }
      }

      if (sessionKey) {
        sessionDataRaw = localStorage.getItem(sessionKey);
      }
      
      if (sessionDataRaw) {
        const sessionData = JSON.parse(sessionDataRaw);
        
        // 2. Rigorous check for validity before attempting to set session
        if (sessionData.access_token && sessionData.refresh_token) {
          supabase.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
          }).then(({ error }) => {
            if (error && sessionKey) {
              // If Supabase rejects the tokens, clear the bad key.
              localStorage.removeItem(sessionKey);
            }
            // The onAuthStateChange listener will handle fetching the profile.
          });
        }
      }
    } catch (e) {
      console.error('Failed to restore session from localStorage, starting fresh.', e);
      // If anything fails (e.g., JSON parse error), we just stay logged out.
      // For good measure, we can clean up any potential Supabase keys.
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.startsWith('supabase.'))) {
          localStorage.removeItem(key);
        }
      }
    }

    // This listener now handles real-time events (login, logout, token refresh)
    // AND the profile fetching after a successful manual session restoration.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session?.user) {
          setCurrentUser(null);
          return;
        }

        // A session is active, fetch the associated profile.
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error || !profile) {
          console.error('Error fetching profile for active session, logging out.', error);
          // If we can't get a profile for an active session, something is wrong. Log out.
          await supabase.auth.signOut();
          setCurrentUser(null);
        } else {
           const fullUser: User = {
            ...profile,
            email: session.user.email!,
          };

          setCurrentUser(fullUser);

          setUsers(prev => {
            const userExists = prev.some(u => u.id === fullUser.id);
            if (userExists) {
              return prev.map(u => u.id === fullUser.id ? fullUser : u);
            }
            return [...prev, fullUser];
          });
        }
      }
    );
    
    return () => {
        subscription?.unsubscribe();
    };
  }, []);

  const getUserById = useCallback((id: string): User | undefined => {
    return users.find(u => u.id === id);
  }, [users]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (data.session) {
       // Since persistSession is false, we must manually save the session to localStorage.
       // FIX: The `getProject()` method does not exist. The project ID is derived from the Supabase URL environment variable.
       const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
       if (!supabaseUrl) {
           throw new Error("VITE_SUPABASE_URL is not set in environment variables.");
       }
       const projectId = new URL(supabaseUrl).hostname.split('.')[0];
       const sessionKey = `sb-${projectId}-auth-token`;
       localStorage.setItem(sessionKey, JSON.stringify(data.session));
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, username: string): Promise<void> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });
  
    if (error) {
      if (error.message.includes('User already registered')) {
        throw new Error('Email này đã được sử dụng.');
      }
      if (error.message.includes('duplicate key value violates unique constraint')) {
        throw new Error('Tên người dùng này đã tồn tại.');
      }
      throw new Error(`Database error saving new user`);
    }

     if (data.session) {
       // Manually save session on signup as well.
       // FIX: The `getProject()` method does not exist. The project ID is derived from the Supabase URL environment variable.
       const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
       if (!supabaseUrl) {
           throw new Error("VITE_SUPABASE_URL is not set in environment variables.");
       }
       const projectId = new URL(supabaseUrl).hostname.split('.')[0];
       const sessionKey = `sb-${projectId}-auth-token`;
       localStorage.setItem(sessionKey, JSON.stringify(data.session));
    }
  }, []);


  const logout = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    
    // Manually clear all Supabase-related keys from localStorage on logout.
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.startsWith('supabase.'))) {
          localStorage.removeItem(key);
        }
    }

    setCurrentUser(null);
    setHasFetchedAllUsers(false);
  }, []);

  const addExp = useCallback(async (amount: number) => {
    if (!currentUser) return;

    const newExp = (currentUser.exp || 0) + amount;
    setCurrentUser(prev => prev ? { ...prev, exp: newExp } : null);
    
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('add_exp', {
      user_id_to_update: currentUser.id,
      exp_to_add: amount,
    });

    if (error) {
      console.error('Error adding EXP:', error);
      setCurrentUser(prev => prev ? { ...prev, exp: (prev.exp || 0) - amount } : null);
    }
  }, [currentUser]);
  
  const updateUserByAdmin = useCallback(async (userId: string, updates: Partial<Pick<User, 'username' | 'role' | 'customTitle' | 'customTitleColor' | 'avatarUrl'>>) => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Chỉ quản trị viên mới có quyền thực hiện hành động này.');
    }
    
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw new Error(error.message);
    
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updates } : u));
  }, [currentUser?.role]);

  const updateProfile = useCallback(async (userId: string, updates: Partial<Pick<User, 'username' | 'avatarUrl'>>) => {
    if (currentUser?.id !== userId) {
      throw new Error('Bạn không có quyền chỉnh sửa thông tin người dùng này.');
    }
    
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw new Error(error.message);

    setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updates } : u));
  }, [currentUser?.id]);
  
  const changePassword = useCallback(async (newPass: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw new Error(error.message);
  }, []);

  const updateRanks = useCallback((newRanks: Rank[]): void => {
    if (currentUser?.role !== 'admin') {
        throw new Error('Chỉ quản trị viên mới có quyền thực hiện hành động này.');
    }
    setRanks(newRanks);
  }, [currentUser?.role, setRanks]);

  const value = {
    currentUser,
    users,
    ranks,
    setUsers,
    hasFetchedAllUsers,
    setHasFetchedAllUsers,
    login,
    signup,
    logout,
    addExp,
    getUserById,
    updateUserByAdmin,
    updateProfile,
    changePassword,
    updateRanks,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
