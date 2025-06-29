/*
  # Disable email confirmation for development

  1. Configuration Changes
    - Disable email confirmation requirement
    - Allow users to sign in immediately after signup
    - Configure for development environment

  2. Security Notes
    - This is for development/testing purposes only
    - In production, email confirmation should be enabled
    - Users can sign in immediately without email verification
*/

-- This migration helps with development by allowing immediate sign-in
-- Note: The actual email confirmation setting needs to be changed in Supabase Dashboard
-- Go to Authentication > Settings > Email Confirmation and set it to "Disabled"

-- Create a function to help with user management
CREATE OR REPLACE FUNCTION confirm_user_email(user_email text)
RETURNS void AS $$
BEGIN
  -- This function can be used to manually confirm users if needed
  UPDATE auth.users 
  SET email_confirmed_at = now(), 
      confirmed_at = now()
  WHERE email = user_email 
    AND email_confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION confirm_user_email(text) TO authenticated;