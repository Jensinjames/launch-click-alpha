-- Fix handle_new_user function to handle duplicates gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile first (no dependencies) - handle conflicts gracefully
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert initial plan (depends on profile) - handle conflicts gracefully
  INSERT INTO public.user_plans (user_id, plan_type, credits)
  VALUES (NEW.id, 'starter', 50)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert initial credits (depends on profile) - handle conflicts gracefully
  INSERT INTO public.user_credits (user_id, monthly_limit, credits_used)
  VALUES (NEW.id, 50, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert default preferences (depends on profile) - handle conflicts gracefully
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Log user registration (depends on profile) - this can have duplicates
  INSERT INTO public.user_activity_log (user_id, action, metadata)
  VALUES (NEW.id, 'user_registered', jsonb_build_object('registration_date', now()));
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';