
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { NewsletterService } from "../services/newsletterService";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sanitizeInput = (input: string): string => {
    return input.trim().toLowerCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedEmail = sanitizeInput(email);
    
    if (!sanitizedEmail) {
      toast.error("Please enter your email address");
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    
    try {
      const result = await NewsletterService.subscribe(email);
      
      if (result.success) {
        toast.success("Successfully subscribed to newsletter!");
        setEmail("");
      } else {
        toast.error(result.error || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-8 md:p-12">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Get AI Marketing Tips & Free Templates
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Weekly insights delivered to your inbox
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              id="newsletter-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
              disabled={loading}
              maxLength={254}
              autoComplete="email"
            />
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
            >
              {loading ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
