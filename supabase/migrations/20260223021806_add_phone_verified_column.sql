-- Add phone_verified column to user_profiles for Twilio Verify OTP
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;

-- Add a comment for documentation
COMMENT ON COLUMN user_profiles.phone_verified IS 'Whether the user has verified their phone number via Twilio Verify OTP';
