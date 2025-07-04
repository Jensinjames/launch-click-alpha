-- Update handle_new_user function to create user_preferences automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert initial credits (this must come first)
  INSERT INTO public.user_credits (user_id, monthly_limit, credits_used)
  VALUES (NEW.id, 50, 0);
  
  -- Insert initial plan
  INSERT INTO public.user_plans (user_id, plan_type, credits)
  VALUES (NEW.id, 'starter', 50);
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Insert default preferences (NEW - this was missing)
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  -- Log user registration
  INSERT INTO public.user_activity_log (user_id, action, metadata)
  VALUES (NEW.id, 'user_registered', jsonb_build_object('registration_date', now()));
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';