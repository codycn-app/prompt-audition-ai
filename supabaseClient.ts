import { createClient } from '@supabase/supabase-js';

// These variables should be set in your project's environment variables.
// In a Vite project, this is typically done in a .env file.
// FIX: Replaced `import.meta.env` with `process.env` to fix TypeScript error.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// FIX: Replaced `import.meta.env` with `process.env` to fix TypeScript error.
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
