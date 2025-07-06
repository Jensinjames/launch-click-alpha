import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Loader2 } from "lucide-react";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateTeamDialog = ({ open, onOpenChange, onSuccess }: CreateTeamDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    ownerEmail: "",
    initialRole: "admin"
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Team name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Team name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Team name must be less than 50 characters";
    }

    if (!formData.ownerEmail.trim()) {
      newErrors.ownerEmail = "Owner email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail)) {
      newErrors.ownerEmail = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Find user by email using the users table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.ownerEmail.trim().toLowerCase())
        .single();

      if (profileError || !profiles) {
        toast.error("User not found with this email address");
        return;
      }

      // Check if user has team plan
      const { data: planData, error: planError } = await supabase
        .from('user_plans')
        .select('plan_type, team_seats')
        .eq('user_id', profiles.id)
        .single();

      if (planError || !planData) {
        toast.error("Could not verify user's plan");
        return;
      }

      if (!['growth', 'elite'].includes(planData.plan_type)) {
        toast.error("User does not have a plan that supports team creation");
        return;
      }

      // Check current team count
      const { count: teamCount, error: countError } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', profiles.id);

      if (countError) {
        toast.error("Failed to check user's current teams");
        return;
      }

      const maxTeams = planData.plan_type === 'elite' ? 10 : 3; // Example limits
      if (teamCount !== null && teamCount >= maxTeams) {
        toast.error(`User has reached the maximum number of teams (${maxTeams}) for their plan`);
        return;
      }

      // Create the team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: formData.name.trim(),
          owner_id: profiles.id
        })
        .select()
        .single();

      if (teamError || !teamData) {
        throw new Error(teamError?.message || "Failed to create team");
      }

      // Add owner as team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: profiles.id,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString()
        });

      if (memberError) {
        // Try to clean up the team if member creation failed
        await supabase.from('teams').delete().eq('id', teamData.id);
        throw new Error("Failed to add owner as team member");
      }

      // Log the action
      await supabase.rpc('log_security_event', {
        event_type: 'admin_team_created',
        event_data: { 
          team_id: teamData.id, 
          team_name: teamData.name,
          owner_id: profiles.id,
          owner_email: formData.ownerEmail
        }
      });

      toast.success(`Team "${formData.name}" created successfully`);
      
      // Reset form
      setFormData({ name: "", ownerEmail: "", initialRole: "admin" });
      setErrors({});
      onSuccess();

    } catch (error: any) {
      console.error('Create team error:', error);
      toast.error(error.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Create New Team
          </DialogTitle>
          <DialogDescription>
            Create a new team and assign it to an existing user with a Growth or Elite plan.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name *</Label>
            <Input
              id="team-name"
              name="team-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter team name"
              disabled={loading}
              maxLength={50}
              aria-describedby={errors.name ? "team-name-error" : undefined}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p id="team-name-error" className="text-sm text-destructive" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-email">Team Owner Email *</Label>
            <Input
              id="owner-email"
              name="owner-email"
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => handleInputChange("ownerEmail", e.target.value)}
              placeholder="owner@example.com"
              disabled={loading}
              aria-describedby={errors.ownerEmail ? "owner-email-error" : undefined}
              aria-invalid={!!errors.ownerEmail}
            />
            {errors.ownerEmail && (
              <p id="owner-email-error" className="text-sm text-destructive" role="alert">
                {errors.ownerEmail}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              User must exist and have a Growth or Elite plan
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Team"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};