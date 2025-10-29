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
  isAuthLoading: boolean;
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
  const [session, setSession] = useState<any | null>(null); // Using `any` to avoid import issues with older SDK
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [hasFetchedAllUsers, setHasFetchedAllUsers] = useState(false);
  const [ranks, setRanks] = useLocalStorage<Rank[]>('app-ranks-v2-exp', INITIAL_RANKS);

  // Effect 1: Fast Session Resolution (The "Gatekeeper")
  // Its only job is to determine if a session object exists and then immediately
  // update the loading state to un-gate the rest of the application.
  // This is a fast, non-blocking operation that prevents the app from hanging.
  useEffect(() => {
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setIsAuthLoading(false); // This is the "green light". It fires quickly and reliably.
      }
    );
    
    return () => {
        subscription?.unsubscribe();
    };
  }, []);

  // Effect 2: Safe Profile Fetching (The "Background Worker")
  // This effect runs *after* the session is resolved. It safely fetches user details.
  // If this process fails, it will not hang the app; instead, it will self-heal by logging out.
  useEffect(() => {
    // If there's no session, ensure user is logged out and do nothing else.
    if (!session) {
      setCurrentUser(null);
      return;
    }

    const fetchProfile = async () => {
      const supabase = getSupabaseClient();
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
            // This could be a network error or an RLS issue.
            throw error;
        }

        if (profile) {
            const fullUser: User = {
            ...profile,
            email: session.user.email!,
          };

          setCurrentUser(fullUser);

          // Update the local users cache with the current user's data.
          setUsers(prev => {
            const userExists = prev.some(u => u.id === fullUser.id);
            if (userExists) {
              return prev.map(u => u.id === fullUser.id ? fullUser : u);
            }
            return [...prev, fullUser];
          });
        } else {
            // This is a critical data inconsistency: a user exists in auth but not in our profiles table.
            throw new Error(`Profile not found for user ID: ${session.user.id}`);
        }
      } catch (e) {
        console.error("Critical error fetching profile for session. Signing out to self-heal.", e);
        // Self-healing mechanism: The session is "poisonous". Sign out to clear it.
        await supabase.auth.signOut();
        setCurrentUser(null);
      }
    };

    fetchProfile();
  }, [session]); // This effect is solely dependent on the session object.

  const getUserById = useCallback((id: string): User | undefined => {
    return users.find(u => u.id === id);
  }, [users]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const supabase = getSupabaseClient();
    // Supabase handles session persistence automatically now. No manual localStorage needed.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signup = useCallback(async (email: string, password: string, username: string): Promise<void> => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signUp({
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
    // Supabase handles session persistence automatically. No manual localStorage needed.
  }, []);


  const logout = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    // onAuthStateChange will fire with a null session, which will clear the currentUser state.
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
    isAuthLoading,
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