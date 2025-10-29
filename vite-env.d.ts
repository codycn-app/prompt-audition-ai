// FIX: Removed the problematic reference to "vite/client" to resolve a type definition error.
// This is a workaround for what is likely a project configuration issue.
// The interfaces below provide the necessary types for `import.meta.env`.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
