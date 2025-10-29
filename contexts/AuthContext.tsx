import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { User, Rank } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { INITIAL_RANKS } from '../constants';
import { supabase } from '../supabaseClient';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useToast } from './ToastContext';

interface AuthContextType {
  currentUser: User | null;
  users: User[]; // This will act as a cache for profiles
  ranks: Rank[];
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
  const [users, setUsers] = useState<User[]>([]); // Cache for all user profiles
  const [ranks, setRanks] = useLocalStorage<Rank[]>('app-ranks-v2-exp', INITIAL_RANKS);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchAllUserProfiles = async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            console.error('Error fetching user profiles:', error);
        } else {
            setUsers(data as User[]);
        }
    };

    fetchAllUserProfiles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (error) {
                console.error('Error fetching profile:', error);
                // Now we can show a toast because the provider is outside!
                showToast('Lỗi: Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.', 'error');
                // Log out the user from the client side to prevent an inconsistent state
                await supabase.auth.signOut();
                setCurrentUser(null);
            } else {
                setCurrentUser({
                    ...profile,
                    email: session.user.email!,
                });
            }
        } else {
            setCurrentUser(null);
        }
      }
    );
    
    return () => {
        subscription.unsubscribe();
    };
  }, [showToast]);

  const getUserById = useCallback((id: string): User | undefined => {
    return users.find(u => u.id === id);
  }, [users]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signup = useCallback(async (email: string, password: string, username: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        }
      }
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
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setCurrentUser(null);
  }, []);

  const addExp = useCallback(async (amount: number) => {
    if (!currentUser) return;

    // Optimistic UI update
    const newExp = (currentUser.exp || 0) + amount;
    setCurrentUser(prev => prev ? { ...prev, exp: newExp } : null);

    const { error } = await supabase.rpc('add_exp', {
      user_id_to_update: currentUser.id,
      exp_to_add: amount,
    });

    if (error) {
      console.error('Error adding EXP:', error);
      // Revert UI update on failure
      setCurrentUser(prev => prev ? { ...prev, exp: (prev.exp || 0) - amount } : null);
    }
  }, [currentUser]);
  
  const updateUserByAdmin = useCallback(async (userId: string, updates: Partial<Pick<User, 'username' | 'role' | 'customTitle' | 'customTitleColor' | 'avatarUrl'>>) => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Chỉ quản trị viên mới có quyền thực hiện hành động này.');
    }
    
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw new Error(error.message);
    
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updates } : u));
  }, [currentUser?.role]);

  const updateProfile = useCallback(async (userId: string, updates: Partial<Pick<User, 'username' | 'avatarUrl'>>) => {
    if (currentUser?.id !== userId) {
      throw new Error('Bạn không có quyền chỉnh sửa thông tin người dùng này.');
    }
    
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw new Error(error.message);

    setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updates } : u));
  }, [currentUser?.id]);
  
  const changePassword = useCallback(async (newPass: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw new Error(error.message);
  }, []);

  const updateRanks = useCallback((newRanks: Rank[]): void => {
    if (currentUser?.role !== 'admin') {
        throw new Error('Chỉ quản trị viên mới có quyền thực hiện hành động này.');
    }
    setRanks(newRanks);
  }, [currentUser?.role, setRanks]);

  const value = useMemo(() => ({
    currentUser,
    users,
    ranks,
    login,
    signup,
    logout,
    addExp,
    getUserById,
    updateUserByAdmin,
    updateProfile,
    changePassword,
    updateRanks,
  }), [currentUser, users, ranks, login, signup, logout, addExp, getUserById, updateUserByAdmin, updateProfile, changePassword, updateRanks]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};