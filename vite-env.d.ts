// FIX: Removed the reference to "vite/client" as the type definition file could not be found.
// This is likely a project configuration issue, but removing the line allows this file to be processed
// while still providing the necessary types for `import.meta.env`.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}