export interface ImagePrompt {
  id: number;
  image_url: string;
  title: string;
  prompt: string;
  created_at: string;
  user_id: string; 
  likes: string[]; 
  views: number; 
  profiles: { username: string; avatarUrl: string | null } | null;
  comments_count: number;
  categories: Category[] | null;
}

export interface User {
  id: string; // Changed from number to string for Supabase UUID
  email: string;
  username: string;
  role: 'admin' | 'user';
  password?: string;
  customTitle?: string;
  customTitleColor?: string;
  avatarUrl?: string; 
  created_at: string; 
}

export interface Category {
  id: number;
  name: string;
}

export interface Comment {
    id: number;
    user_id: string; // Changed from number to string for Supabase UUID
    text: string;
    created_at: string;
    image_id: number; // Added for relation to image
    profiles?: { username: string; avatarUrl: string | null }; // For joined data
}

export interface Rank {
  name: string;
  icon: string; 
  color: string;
  requiredPosts: number;
}