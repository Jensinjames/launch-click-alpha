-- Create newsletter subscriptions table
CREATE TABLE public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'website',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (for checking existing subscriptions)
CREATE POLICY "Anyone can check newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR SELECT 
USING (true);

-- Create policy for inserting new subscriptions
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscriptions 
FOR INSERT 
WITH CHECK (true);

-- Create policy for unsubscribing
CREATE POLICY "Anyone can unsubscribe by email" 
ON public.newsletter_subscriptions 
FOR DELETE 
USING (true);