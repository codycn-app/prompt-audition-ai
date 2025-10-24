// Fix: Add a triple-slash directive to include Vite's client types,
// which defines `import.meta.env` for TypeScript.
/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

// These variables should be set in your project's environment variables.
// In a Vite project, this is typically done in a .env file.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);