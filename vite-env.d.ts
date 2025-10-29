// Fix: Define the Vite environment variables to provide type safety
// and resolve errors with `import.meta.env` across the application.
// This also addresses the issue where `vite/client` types might not be found.
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
