
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Loader2, Crown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useCreateTeam } from "../hooks/useCreateTeam";
import { useUserPlan } from "@/hooks/useUserPlan";
import { validateTeamName, validateTeamDescription } from "@/shared/utils/teamValidation";

interface CreateTeamDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const CreateTeamDialog = ({ trigger, onSuccess }: CreateTeamDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    description?: string;
  }>({});
  
  const createTeam = useCreateTeam();
  const { plan: userPlan, canManageTeams } = useUserPlan();

  const canCreateTeam = canManageTeams() && 
    userPlan?.planType && 
    ['growth', 'elite'].includes(userPlan.planType);

  const maxTeams = userPlan?.planType === 'elite' ? 10 : 3;

  const validateForm = () => {
    const errors: { name?: string; description?: string } = {};
    
    const nameValidation = validateTeamName(formData.name);
    if (!nameValidation.valid) {
      errors.name = nameValidation.error;
    }

    const descriptionValidation = validateTeamDescription(formData.description);
    if (!descriptionValidation.valid) {
      errors.description = descriptionValidation.error;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    console.log('Team creation attempt:', {
      formData,
      userPlan,
      canCreateTeam,
      canManageTeams: canManageTeams()
    });

    try {
      const result = await createTeam.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
      
      console.log('Team creation success:', result);
      
      // Reset form and close dialog
      setFormData({ name: "", description: "" });
      setValidationErrors({});
      setOpen(false);
      onSuccess?.();
      
    } catch (error: any) {
      console.error('Team creation error:', error);
      
      // Handle specific error types from edge function
      if (error.message?.includes('Validation failed:') || error.message?.includes('name:')) {
        // Server-side validation error - show field-specific errors
        if (error.message.includes('name:')) {
          setValidationErrors({ name: error.message.split('name: ')[1]?.split(',')[0] });
        }
      } else {
        // Show general error via toast
        toast.error(error.message || "Failed to create team");
      }
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!canCreateTeam) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2 text-primary" />
            Create New Team
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name *</Label>
            <Input
              id="team-name"
              name="team-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Marketing Team, Product Squad"
              disabled={createTeam.isPending}
              maxLength={50}
              required
              className={validationErrors.name ? "border-destructive" : ""}
            />
            {validationErrors.name && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationErrors.name}</AlertDescription>
              </Alert>
            )}
            <p className="text-xs text-muted-foreground">
              Choose a descriptive name for your team
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description">Description (Optional)</Label>
            <Textarea
              id="team-description"
              name="team-description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe what this team does..."
              disabled={createTeam.isPending}
              maxLength={200}
              rows={3}
              className={validationErrors.description ? "border-destructive" : ""}
            />
            {validationErrors.description && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationErrors.description}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
            <p className="font-medium">Team Limits for {userPlan?.planType} Plan:</p>
            <p className="text-muted-foreground">
              • Maximum teams: {maxTeams}
            </p>
            <p className="text-muted-foreground">
              • Team members: {userPlan?.teamSeats} per team
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createTeam.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTeam.isPending || !formData.name.trim() || Object.keys(validationErrors).length > 0}>
              {createTeam.isPending ? (
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
