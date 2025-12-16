/*
  # Create find_user_by_email function
  
  1. New Functions
    - `find_user_by_email(search_email text)`
      - Returns user id and email for a given email address
      - Case-insensitive email matching
      - Security definer to access auth.users table
      - Returns single user or empty result
  
  2. Security
    - Grant execute permission to authenticated users
*/

-- Create function to find user by email
CREATE OR REPLACE FUNCTION find_user_by_email(search_email text)
RETURNS TABLE (
  id uuid,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text
  FROM auth.users u
  WHERE LOWER(u.email) = LOWER(search_email)
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_user_by_email(text) TO authenticated;

