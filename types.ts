export interface ImagePrompt {
  id: number;
  image_url: string;
  title: string;
  prompt: string;
  created_at: string;
  user_id: string; 
  likes: string[]; 
  views: number; 
  profiles: User | null;
  comments_count: number;
  categories: Category[] | null;
  thumbnail_crop_data?: { x: number; y: number; width: number; height: number; } | null;
  original_width?: number;
  original_height?: number;
}

export interface User {
  id: string; // Changed from number to string for Supabase UUID
  email: string;
  username: string;
  role: 'admin' | 'user';
  password?: string;
  customTitle?: string | null;
  customTitleColor?: string | null;
  avatarUrl?: string; 
  created_at: string; 
  exp: number;
}

export interface Category {
  id: number;
  name: string;
  position?: number;
}

export interface Rank {
  name: string;
  icon: string; 
  color: string;
  requiredExp: number;
}

export type CategoryFilter = number | 'all' | 'uncategorized' | 'broken';

export type Page = 'home' | 'settings' | 'user-management' | 'profile' | 'support' | 'categories';
