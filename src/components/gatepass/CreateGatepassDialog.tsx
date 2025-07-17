import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CreateGatepassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateGatepassDialog = ({ open, onOpenChange, onSuccess }: CreateGatepassDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    items_carried: '',
    exit_time: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);

    try {
      // Generate unique gatepass ID
      const { data: gatepassId } = await supabase.rpc('generate_gatepass_id');
      
      const { error } = await supabase
        .from('gatepasses')
        .insert({
          gatepass_id: gatepassId,
          requester_id: profile.user_id,
          requester_name: profile.full_name,
          department: profile.department,
          reason: formData.reason,
          items_carried: formData.items_carried || null,
          exit_time: formData.exit_time,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Gatepass ${gatepassId} created successfully!`,
      });

      setFormData({ reason: '', items_carried: '', exit_time: '' });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create gatepass",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get minimum date/time (current time)
  const now = new Date();
  const minDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Gatepass</DialogTitle>
          <DialogDescription>
            Submit a new gatepass request for approval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for Exit</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for exit..."
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="items_carried">Items Being Carried (Optional)</Label>
              <Textarea
                id="items_carried"
                placeholder="List any items you'll be carrying..."
                value={formData.items_carried}
                onChange={(e) => handleChange('items_carried', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exit_time">Expected Exit Time</Label>
              <Input
                id="exit_time"
                type="datetime-local"
                min={minDateTime}
                value={formData.exit_time}
                onChange={(e) => handleChange('exit_time', e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Gatepass'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGatepassDialog;