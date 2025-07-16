// Newsletter Service - Real API Integration
import { supabase } from "@/integrations/supabase/client";

export interface NewsletterSubscription {
  email: string;
  subscribed_at?: string;
  source?: string;
}

export class NewsletterService {
  static async subscribe(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Check if already subscribed
      const { data: existing } = await supabase
        .from('newsletter_subscriptions')
        .select('email')
        .eq('email', email)
        .single();

      if (existing) {
        return { success: false, error: 'Email already subscribed' };
      }

      // Add to newsletter subscriptions
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({
          email,
          subscribed_at: new Date().toISOString(),
          source: 'website'
        });

      if (error) {
        console.error('Newsletter subscription error:', error);
        return { success: false, error: 'Failed to subscribe. Please try again.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Newsletter service error:', error);
      return { success: false, error: 'Service unavailable. Please try again later.' };
    }
  }

  static async unsubscribe(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .delete()
        .eq('email', email);

      if (error) {
        return { success: false, error: 'Failed to unsubscribe' };
      }

      return { success: true };
    } catch (error) {
      console.error('Newsletter unsubscribe error:', error);
      return { success: false, error: 'Service unavailable' };
    }
  }
}