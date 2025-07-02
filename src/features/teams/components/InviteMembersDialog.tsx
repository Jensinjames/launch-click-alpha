import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useInviteMembers } from "@/hooks/team/mutations/useInviteMembers";
import { UserPlus, Mail, X } from "lucide-react";
import { toast } from "sonner";

interface InviteMembersDialogProps {
  teamId: string;
  currentUserRole: string;
  trigger?: React.ReactNode;
}

export const InviteMembersDialog = ({ teamId, currentUserRole, trigger }: InviteMembersDialogProps) => {
  const [open, setOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<string>("viewer");
  
  const inviteMembers = useInviteMembers();

  const canInvite = ['owner', 'admin'].includes(currentUserRole);

  const addEmail = () => {
    const trimmedEmail = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!trimmedEmail) return;
    
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (emails.includes(trimmedEmail)) {
      toast.error("Email already added");
      return;
    }
    
    setEmails([...emails, trimmedEmail]);
    setEmailInput("");
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleInvite = async () => {
    if (emails.length === 0) {
      toast.error("Please add at least one email address");
      return;
    }

    try {
      await inviteMembers.mutateAsync({
        teamId,
        emails,
        role
      });
      
      // Reset form
      setEmails([]);
      setEmailInput("");
      setRole("viewer");
      setOpen(false);
      
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitations");
    }
  };

  if (!canInvite) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Members
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Invite Team Members
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Addresses</Label>
            <div className="flex space-x-2">
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={inviteMembers.isPending}
              />
              <Button 
                type="button" 
                onClick={addEmail}
                disabled={inviteMembers.isPending}
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>

          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Added Emails ({emails.length})</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="pr-1">
                    {email}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 ml-1"
                      onClick={() => removeEmail(email)}
                      disabled={inviteMembers.isPending}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={inviteMembers.isPending}>
              <SelectTrigger id="invite-role-select">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                {currentUserRole === 'owner' && (
                  <SelectItem value="admin">Admin</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={inviteMembers.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={emails.length === 0 || inviteMembers.isPending}
            >
              {inviteMembers.isPending ? "Sending..." : `Send ${emails.length} Invitation${emails.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};