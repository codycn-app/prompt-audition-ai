import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Rank } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { INITIAL_RANKS } from '../constants';
import { supabase } from '../supabaseClient';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  currentUser: User | null;
  users: User[]; // This will act as a cache for profiles
  ranks: Rank[];
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  getUserById: (id: string) => User | undefined;
  updateUserByAdmin: (userId: string, updates: Partial<Pick<User, 'username' | 'role' | 'customTitle' | 'customTitleColor' | 'avatar_url'>>) => void;
  updateProfile: (userId: string, updates: Partial<Pick<User, 'username' | 'avatar_url'>>) => Promise<void>;
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
  const [ranks, setRanks] = useLocalStorage<Rank[]>('app-ranks-v1', INITIAL_RANKS);
  const [loading, setLoading] = useState(true);

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
        setLoading(true);
        if (session?.user) {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (error) {
                console.error('Error fetching profile:', error);
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
        setLoading(false);
      }
    );
    
    return () => {
        subscription.unsubscribe();
    };
  }, []);

  const getUserById = (id: string): User | undefined => {
    return users.find(u => u.id === id);
  }

  const login = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signup = async (email: string, password: string, username: string): Promise<void> => {
    // This is the standard, robust way to handle sign-ups with profiles.
    // We pass the username as metadata, and a database trigger will create the profile.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          // You can add a default avatar here if you want
          // avatar_url: 'https://....'
        }
      }
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        throw new Error('Email này đã được sử dụng.');
      }
      throw new Error(`Lỗi đăng ký: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Đăng ký không thành công, vui lòng thử lại.');
    }
    
    // After sign up, the onAuthStateChange listener will automatically fetch the new profile.
    // We can also manually add the user to the local cache for instant UI updates.
    const newUserProfile: User = {
        id: data.user.id,
        email: email,
        username: username,
        role: 'user',
        created_at: new Date().toISOString(),
    };
    setUsers(prevUsers => [...prevUsers, newUserProfile]);

  };


  const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setCurrentUser(null);
  };
  
  const updateUserByAdmin = async (userId: string, updates: Partial<Pick<User, 'username' | 'role' | 'customTitle' | 'customTitleColor' | 'avatar_url'>>) => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Chỉ quản trị viên mới có quyền thực hiện hành động này.');
    }
    
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw new Error(error.message);
    
    // Refresh local cache
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  const updateProfile = async (userId: string, updates: Partial<Pick<User, 'username' | 'avatar_url'>>) => {
    if (currentUser?.id !== userId) {
      throw new Error('Bạn không có quyền chỉnh sửa thông tin người dùng này.');
    }
    
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw new Error(error.message);

    // Update current user state immediately
    setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updates } : u));
  };
  
  const changePassword = async (newPass: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw new Error(error.message);
  };

  const updateRanks = (newRanks: Rank[]): void => {
    if (currentUser?.role !== 'admin') {
        throw new Error('Chỉ quản trị viên mới có quyền thực hiện hành động này.');
    }
    setRanks(newRanks);
  };

  const value = {
    currentUser,
    users,
    ranks,
    login,
    signup,
    logout,
    getUserById,
    updateUserByAdmin,
    updateProfile,
    changePassword,
    updateRanks,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};