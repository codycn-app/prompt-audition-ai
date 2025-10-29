// This file provides type definitions for Vite's `import.meta.env`.
// The original `/// <reference types="vite/client" />` was removed as it was causing an error,
// likely due to a misconfigured environment. The manual definitions below serve as a robust replacement.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
