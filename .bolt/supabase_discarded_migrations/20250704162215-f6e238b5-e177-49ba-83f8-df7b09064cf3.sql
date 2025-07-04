-- Fix foreign key constraint error in handle_new_user function
-- Step 1: Update the handle_new_user function with correct order and error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First, insert profile (this must come first for foreign key references)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Second, insert initial credits (now that profile exists)
  INSERT INTO public.user_credits (user_id, monthly_limit, credits_used)
  VALUES (NEW.id, 50, 0);
  
  -- Finally, insert initial plan
  INSERT INTO public.user_plans (user_id, plan_type, credits)
  VALUES (NEW.id, 'starter', 50);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error with more detail and re-raise it to prevent user creation
    RAISE LOG 'Error in handle_new_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

-- Step 2: Clean up duplicate foreign key constraints on user_credits
-- Remove the redundant constraint that references auth.users directly
ALTER TABLE public.user_credits DROP CONSTRAINT IF EXISTS user_credits_user_id_fkey;

-- Keep only the essential foreign key constraint that references profiles
-- The fk_user_credits_profiles constraint should remain as it's the correct one