import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// These variables are injected from the project's environment settings via Vite.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// DEFINITIVE FIX: Environment variables can be passed with extra whitespace or quotes,
// which can cause the Supabase client to hang silently on initialization without throwing an error.
// This sanitizer robustly cleans the URL and key to prevent this critical issue.
const sanitizeEnvVar = (variable: string | undefined): string | undefined => {
    if (!variable) {
        return variable;
    }
    let sanitized = variable.trim();
    if ((sanitized.startsWith('"') && sanitized.endsWith('"')) || (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
        sanitized = sanitized.slice(1, -1);
    }
    return sanitized;
};

const sanitizedUrl = sanitizeEnvVar(supabaseUrl);
const sanitizedAnonKey = sanitizeEnvVar(supabaseAnonKey);

if (!sanitizedUrl || !sanitizedAnonKey) {
    throw new Error("Supabase URL and Anon Key are missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.");
}

export const getSupabaseClient = (): SupabaseClient => {
    if (!supabaseInstance) {
        supabaseInstance = createClient(sanitizedUrl, sanitizedAnonKey);
    }
    return supabaseInstance;
};
