// FIX: Removed the reference to 'vite/client' as it was causing a type
// resolution error in the user's environment. The interface augmentations
// below should be sufficient for a modern TypeScript setup with Vite.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
