
-- Add unique constraints for username and phone_number on profiles
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_number_unique ON public.profiles (phone_number) WHERE phone_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_unique ON public.profiles (user_id);
