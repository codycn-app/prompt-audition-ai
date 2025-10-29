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
    // DEFINITIVE FIX for application hang on reload.
    // This logic is now wrapped in a try/catch block. If fetching the profile fails for any reason
    // after rehydrating the session (e.g., network error, RLS issue, corrupted but parsable session),
    // it will be caught, and the user will be safely signed out, clearing the problematic session data.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          // If there's no session or user, we are logged out.
          if (!session?.user) {
            setCurrentUser(null);
            return;
          }

          // A session exists, now fetch the user's profile from the database.
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // If Supabase returns an error (e.g., RLS violation), treat it as a critical failure.
          if (error) {
            throw error;
          }

          // This can happen if a user exists in auth but their profile was deleted.
          if (!profile) {
            throw new Error(`Profile not found for user ID: ${session.user.id}`);
          }
          
          const fullUser: User = {
            ...profile,
            email: session.user.email!,
          };

          setCurrentUser(fullUser);

          // Ensure the current user's profile is always in the `users` cache
          setUsers(prev => {
            const userExists = prev.some(u => u.id === fullUser.id);
            if (userExists) {
              return prev.map(u => u.id === fullUser.id ? fullUser : u);
            }
            return [...prev, fullUser];
          });

        } catch (e) {
          console.error('Critical error during session handling. Signing out to prevent app hang.', e);
          // This is the safety net. If anything goes wrong, sign out to clear the bad session.
          await supabase.auth.signOut();
          setCurrentUser(null);
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
    // FIX: The 'signIn' method is from an older Supabase SDK version. The current version uses 'signInWithPassword'.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signup = useCallback(async (email: string, password: string, username: string): Promise<void> => {
    const supabase = getSupabaseClient();
    // FIX: The two-argument signature for signUp is from an older Supabase SDK. The current version expects a single object with an 'options' property for metadata.
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
  }, []);


  const logout = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseClient();
    // FIX: The `signOut` method exists in older Supabase SDKs. The error is likely due to faulty type definitions in the user's environment. The syntax is correct.
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setCurrentUser(null);
    setHasFetchedAllUsers(false); // Reset on logout
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
    // FIX: The 'update' method is from an older Supabase SDK version. The current version uses 'updateUser'.
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