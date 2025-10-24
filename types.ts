export interface ImagePrompt {
  id: number;
  imageUrl: string;
  title: string;
  prompt: string;
  keywords: string[];
  createdAt: string;
  userId: string; 
  likes: string[]; 
  views: number; 
  profiles?: { username: string; avatarUrl: string | null }; // For joined data
  // FIX: Made comments optional as new images won't have this joined data.
  comments?: { count: number }[];
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
}

export interface Category {
  id: string;
  name: string;
}

export interface Comment {
    id: number;
    userId: string; // Changed from number to string for Supabase UUID
    text: string;
    createdAt: string;
    image_id: number; // Added for relation to image
    profiles?: { username: string; avatarUrl: string | null }; // For joined data
}

export interface Rank {
  name: string;
  icon: string; 
  color: string;
  requiredPosts: number;
}
