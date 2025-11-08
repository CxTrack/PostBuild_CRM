/*
  # Add Profile Creation Trigger

  1. New Functions
    - Creates a trigger function to automatically create a profile when a new user signs up
    
  2. Security
    - Ensures profile is created with proper user_id
    - Maintains RLS policies
    
  3. Changes
    - Adds trigger on auth.users table
    - Ensures profile exists for all users
*/

-- Create trigger function for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, company, address, city, state, zipCode, country, phone)
  VALUES (
    NEW.id,
    '',  -- Default company name
    '',         -- Empty address
    '',         -- Empty city
    '',         -- Empty state
    '',         -- Empty zipCode
    '',         -- Empty country
    ''          -- Empty phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own profile
CREATE POLICY "Users can manage their own profile"
  ON public.profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);