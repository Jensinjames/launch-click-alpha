
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CreditCard, Search, Edit, RefreshCw } from 'lucide-react';
import { useAdminMutations } from '@/hooks/useAdminMutations';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { UserCredits } from '@/types/admin';
import { useDebounced } from '@/hooks/useDebounced';

// Memoized table row component
const CreditRow = React.memo(({ 
  credit, 
  onEdit, 
  onReset,
  isLoading 
}: {
  credit: UserCredits;
  onEdit: (credit: UserCredits) => void;
  onReset: (userId: string, userName: string) => void;
  isLoading: boolean;
}) => {
  const utilizationPercentage = useMemo(() => 
    Math.min((credit.credits_used / credit.monthly_limit) * 100, 100)
  , [credit.credits_used, credit.monthly_limit]);

  const handleEdit = useCallback(() => onEdit(credit), [onEdit, credit]);
  
  const handleReset = useCallback(() => {
    const userName = credit.profiles?.full_name || credit.profiles?.email || 'Unknown User';
    onReset(credit.user_id, userName);
  }, [onReset, credit.user_id, credit.profiles]);

  return (
    <tr className="border-b">
      <td className="px-4 py-3">
        <div>
          <div className="font-medium">{credit.profiles?.full_name || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{credit.profiles?.email}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant={credit.profiles?.role === 'super_admin' ? 'default' : 'secondary'}>
          {credit.profiles?.role || 'user'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <span>{credit.credits_used}</span>
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${utilizationPercentage}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3">{credit.monthly_limit}</td>
      <td className="px-4 py-3">
        {new Date(credit.reset_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            title="Edit credit limit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isLoading}
            title="Reset credits to 0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </td>
    </tr>
  );
});

CreditRow.displayName = 'CreditRow';

export const OptimizedCreditsManagement = React.memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCredit, setEditingCredit] = useState<UserCredits | null>(null);
  const [newLimit, setNewLimit] = useState('');
  
  const debouncedSearchTerm = useDebounced(searchTerm, 300);
  const { updateUserCredits, resetUserCredits, isLoading } = useAdminMutations();

  // Optimized query with proper stale time
  const { data: userCredits, isLoading: creditsLoading } = useQuery({
    queryKey: ['admin-credits'],
    queryFn: async (): Promise<UserCredits[]> => {
      const { data, error } = await supabase
        .from('user_credits')
        .select(`
          *,
          profiles!fk_user_credits_profiles(full_name, email, role)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Memoized filtered credits
  const filteredCredits = useMemo(() => {
    if (!userCredits) return [];
    if (!debouncedSearchTerm) return userCredits;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return userCredits.filter(credit =>
      credit.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      credit.profiles?.email?.toLowerCase().includes(searchLower)
    );
  }, [userCredits, debouncedSearchTerm]);

  const handleUpdateCredits = useCallback(() => {
    if (!editingCredit || !newLimit) return;
    
    const limit = parseInt(newLimit);
    if (isNaN(limit) || limit < 0) return;

    updateUserCredits.mutate({ 
      userId: editingCredit.user_id, 
      newMonthlyLimit: limit 
    }, {
      onSuccess: () => {
        setEditingCredit(null);
        setNewLimit('');
      }
    });
  }, [editingCredit, newLimit, updateUserCredits]);

  const handleResetCredits = useCallback((userId: string, userName: string) => {
    if (confirm(`Are you sure you want to reset credits for ${userName}? This will set their used credits to 0 and update their reset date.`)) {
      resetUserCredits.mutate(userId);
    }
  }, [resetUserCredits]);

  const handleEditCredit = useCallback((credit: UserCredits) => {
    setEditingCredit(credit);
    setNewLimit(credit.monthly_limit.toString());
  }, []);

  const handleCloseDialog = useCallback(() => {
    setEditingCredit(null);
    setNewLimit('');
  }, []);

  if (creditsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credits Management</CardTitle>
        </CardHeader>
        <CardContent>
          <TableSkeleton columns={6} rows={5} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Credits Management</span>
            </CardTitle>
            <CardDescription>
              Manage user credit limits and reset credits as needed
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Credits Used</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Monthly Limit</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Reset Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCredits.map((credit) => (
                <CreditRow
                  key={credit.user_id}
                  credit={credit}
                  onEdit={handleEditCredit}
                  onReset={handleResetCredits}
                  isLoading={isLoading}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Dialog */}
        <Dialog 
          open={!!editingCredit} 
          onOpenChange={(open) => !open && handleCloseDialog()}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Credit Limit</DialogTitle>
              <DialogDescription>
                Change the monthly credit limit for {editingCredit?.profiles?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="creditLimit">Monthly Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="Enter new limit"
                  min="0"
                  max="10000"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateCredits} disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Limit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {filteredCredits.length === 0 && (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'No user credits found.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>  
  );
});

OptimizedCreditsManagement.displayName = 'OptimizedCreditsManagement';
