import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit3, Loader2 } from "lucide-react";

interface Team {
  id: string;
  name: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
}

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  onSuccess: () => void;
}

export const EditTeamDialog = ({ open, onOpenChange, team, onSuccess }: EditTeamDialogProps) => {
  const [formData, setFormData] = useState({
    name: team.name,
    transferEmail: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTransfer, setShowTransfer] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Team name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Team name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      newErrors.name = "Team name must be less than 50 characters";
    }

    if (showTransfer) {
      if (!formData.transferEmail.trim()) {
        newErrors.transferEmail = "New owner email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.transferEmail)) {
        newErrors.transferEmail = "Please enter a valid email address";
      } else if (formData.transferEmail.trim().toLowerCase() === team.profiles?.email?.toLowerCase()) {
        newErrors.transferEmail = "Cannot transfer to current owner";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateName = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('teams')
        .update({ name: formData.name.trim() })
        .eq('id', team.id);

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_security_event', {
        event_type: 'admin_team_updated',
        event_data: { 
          team_id: team.id, 
          old_name: team.name,
          new_name: formData.name.trim()
        }
      });

      toast.success("Team name updated successfully");
      onSuccess();

    } catch (error: any) {
      console.error('Update team error:', error);
      toast.error(error.message || "Failed to update team");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Find new owner by email using profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.transferEmail.trim().toLowerCase())
        .single();

      if (profileError || !profiles) {
        toast.error("User not found with this email address");
        return;
      }

      // Check if user has team plan
      const { data: planData, error: planError } = await supabase
        .from('user_plans')
        .select('plan_type')
        .eq('user_id', profiles.id)
        .single();

      if (planError || !planData || !['growth', 'elite'].includes(planData.plan_type)) {
        toast.error("New owner must have a Growth or Elite plan");
        return;
      }

      // Update team ownership
      const { error: updateError } = await supabase
        .from('teams')
        .update({ owner_id: profiles.id })
        .eq('id', team.id);

      if (updateError) throw updateError;

      // Update team member roles
      const { error: memberError } = await supabase
        .from('team_members')
        .update({ role: 'admin' })
        .eq('team_id', team.id)
        .eq('role', 'owner');

      if (memberError) {
        console.error('Failed to update old owner role:', memberError);
      }

      // Add new owner as team member if not already a member
      const { error: newMemberError } = await supabase
        .from('team_members')
        .upsert({
          team_id: team.id,
          user_id: profiles.id,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString()
        });

      if (newMemberError) {
        console.error('Failed to add new owner as member:', newMemberError);
      }

      // Log the action
      await supabase.rpc('log_security_event', {
        event_type: 'admin_team_ownership_transferred',
        event_data: { 
          team_id: team.id,
          team_name: team.name,
          new_owner_id: profiles.id,
          new_owner_email: formData.transferEmail
        }
      });

      toast.success("Team ownership transferred successfully");
      onSuccess();

    } catch (error: any) {
      console.error('Transfer ownership error:', error);
      toast.error(error.message || "Failed to transfer ownership");
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
            <Edit3 className="h-5 w-5 mr-2" />
            Edit Team: {team.name}
          </DialogTitle>
          <DialogDescription>
            Update team settings, rename the team, or transfer ownership to another user.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Update Team Name */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
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

            <Button 
              onClick={handleUpdateName} 
              disabled={loading || formData.name === team.name}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Name"
              )}
            </Button>
          </div>

          <div className="border-t pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Transfer Ownership</h4>
                  <p className="text-xs text-muted-foreground">
                    Current owner: {team.profiles?.full_name || team.profiles?.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTransfer(!showTransfer)}
                  disabled={loading}
                >
                  {showTransfer ? 'Cancel' : 'Transfer'}
                </Button>
              </div>

              {showTransfer && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transfer-email">New Owner Email</Label>
                    <Input
                      id="transfer-email"
                      name="transfer-email"
                      type="email"
                      value={formData.transferEmail}
                      onChange={(e) => handleInputChange("transferEmail", e.target.value)}
                      placeholder="new-owner@example.com"
                      disabled={loading}
                      aria-describedby={errors.transferEmail ? "transfer-email-error" : undefined}
                      aria-invalid={!!errors.transferEmail}
                    />
                    {errors.transferEmail && (
                      <p id="transfer-email-error" className="text-sm text-destructive" role="alert">
                        {errors.transferEmail}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      User must exist and have a Growth or Elite plan
                    </p>
                  </div>

                  <Button 
                    onClick={handleTransferOwnership} 
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Transferring...
                      </>
                    ) : (
                      "Transfer Ownership"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};