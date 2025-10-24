import { createClient } from '@supabase/supabase-js';

// These variables should be set in your project's environment variables.
// In a Vite project, this is typically done in a .env file.
// FIX: Changed import.meta.env to process.env to resolve type error and maintain consistency with other files.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// FIX: Changed import.meta.env to process.env to resolve type error and maintain consistency with other files.
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);