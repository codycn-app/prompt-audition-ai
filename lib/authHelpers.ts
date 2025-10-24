import { supabase } from '../supabaseClient';

/**
 * Creates a new user profile in the 'profiles' table after successful authentication.
 * This function is isolated to ensure it can be re-bundled correctly, bypassing build cache issues.
 * It does NOT send a 'created_at' field, relying on the database's DEFAULT now() function.
 * @param userId - The UUID of the newly created user from Supabase Auth.
 * @param username - The chosen username for the profile.
 * @param email - The user's email address.
 */
export const createNewUserProfile = async (userId: string, username: string, email: string) => {
  const profilePayload = {
    id: userId,
    username: username,
    email: email,
    role: 'user', // Default role for new users
  };

  // DIAGNOSTIC LOG: This is the definitive check to see if the new code is running.
  console.log('>>> RUNNING NEW PROFILE CREATION V2 <<<', profilePayload);

  const { error: profileError } = await supabase.from('profiles').insert(profilePayload);

  if (profileError) {
    // This error often occurs if RLS (Row Level Security) is enabled but no policy
    // allows a newly authenticated user to INSERT their own profile.
    // The policy should be: `auth.uid() = id` for the INSERT operation on the 'profiles' table.
    throw new Error(`Tạo tài khoản thành công nhưng không thể tạo hồ sơ: ${profileError.message}`);
  }
};
