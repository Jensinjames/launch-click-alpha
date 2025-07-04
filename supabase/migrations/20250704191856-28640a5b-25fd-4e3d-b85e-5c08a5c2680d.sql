-- Create missing user_preferences record for any users who don't have one
INSERT INTO public.user_preferences (user_id)
SELECT p.id 
FROM public.profiles p
LEFT JOIN public.user_preferences up ON p.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;