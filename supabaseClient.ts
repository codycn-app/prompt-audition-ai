import { createClient } from '@supabase/supabase-js';

// These variables are injected from the project's environment settings via Vite.
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// DEFINITIVE FIX: Environment variables can sometimes be passed with extra quotes.
// This sanitizer removes them to prevent an invalid URL/key from being passed to the client,
// which was causing the connection to hang silently. This is the root cause of the data loading failure.
if (supabaseUrl && supabaseUrl.startsWith('"') && supabaseUrl.endsWith('"')) {
    supabaseUrl = supabaseUrl.slice(1, -1);
}
if (supabaseAnonKey && supabaseAnonKey.startsWith('"') && supabaseAnonKey.endsWith('"')) {
    supabaseAnonKey = supabaseAnonKey.slice(1, -1);
}

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);