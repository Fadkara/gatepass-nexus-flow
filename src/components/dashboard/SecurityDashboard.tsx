import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, CheckCircle, XCircle, ExternalLink, Search, User, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Gatepass {
  id: string;
  gatepass_id: string;
  requester_name: string;
  department: string;
  reason: string;
  items_carried: string | null;
  exit_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'issued' | 'exited';
  created_at: string;
}

const SecurityDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [gatepasses, setGatepasses] = useState<Gatepass[]>([]);
  const [filteredGatepasses, setFilteredGatepasses] = useState<Gatepass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedGatepass, setSelectedGatepass] = useState<Gatepass | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitSearchTerm, setExitSearchTerm] = useState('');

  useEffect(() => {
    fetchGatepasses();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('gatepasses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gatepasses'
        },
        () => {
          fetchGatepasses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = gatepasses;

    if (searchTerm) {
      filtered = filtered.filter(gatepass =>
        gatepass.gatepass_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gatepass.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gatepass.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(gatepass => gatepass.status === statusFilter);
    }

    setFilteredGatepasses(filtered);
  }, [gatepasses, searchTerm, statusFilter]);

  const fetchGatepasses = async () => {
    try {
      const { data, error } = await supabase
        .from('gatepasses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGatepasses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch gatepasses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (gatepassId: string) => {
    try {
      const { error } = await supabase
        .from('gatepasses')
        .update({
          status: 'approved',
          approved_by: profile?.user_id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', gatepassId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Gatepass approved successfully",
      });

      setShowApprovalDialog(false);
      setSelectedGatepass(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to approve gatepass",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (gatepassId: string) => {
    try {
      const { error } = await supabase
        .from('gatepasses')
        .update({
          status: 'rejected',
          approved_by: profile?.user_id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', gatepassId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Gatepass rejected",
      });

      setShowApprovalDialog(false);
      setSelectedGatepass(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reject gatepass",
        variant: "destructive",
      });
    }
  };

  const handleExit = async () => {
    if (!exitSearchTerm) return;

    try {
      const { data: gatepass, error: fetchError } = await supabase
        .from('gatepasses')
        .select('*')
        .eq('gatepass_id', exitSearchTerm.toUpperCase())
        .eq('status', 'approved')
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!gatepass) {
        toast({
          title: "Not Found",
          description: "No approved gatepass found with this ID",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('gatepasses')
        .update({
          status: 'exited',
          exited_at: new Date().toISOString(),
        })
        .eq('id', gatepass.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Exit confirmed for ${gatepass.gatepass_id}`,
      });

      setShowExitDialog(false);
      setExitSearchTerm('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to confirm exit",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
      case 'issued':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'exited':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
      case 'issued':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'exited':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const statusCounts = gatepasses.reduce((acc, gatepass) => {
    acc[gatepass.status] = (acc[gatepass.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">Manage gatepass approvals and exits</p>
        </div>
        <Button onClick={() => setShowExitDialog(true)}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Confirm Exit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.approved || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.rejected || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exited</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.exited || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Gatepass Management</CardTitle>
          <CardDescription>Review and manage gatepass requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by ID, name, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="exited">Exited</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredGatepasses.map((gatepass) => (
              <div key={gatepass.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(gatepass.status)}
                  <div>
                    <div className="font-medium">{gatepass.gatepass_id}</div>
                    <div className="text-sm text-muted-foreground">
                      {gatepass.requester_name} • {gatepass.department}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {gatepass.reason}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusVariant(gatepass.status)}>
                    {gatepass.status.toUpperCase()}
                  </Badge>
                  {gatepass.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedGatepass(gatepass);
                        setShowApprovalDialog(true);
                      }}
                    >
                      Review
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredGatepasses.length === 0 && (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No gatepasses found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No gatepasses match your current filters.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Gatepass</DialogTitle>
            <DialogDescription>
              Review the details and approve or reject this gatepass request.
            </DialogDescription>
          </DialogHeader>
          {selectedGatepass && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gatepass ID</Label>
                  <p className="text-sm">{selectedGatepass.gatepass_id}</p>
                </div>
                <div>
                  <Label>Requester</Label>
                  <p className="text-sm">{selectedGatepass.requester_name}</p>
                </div>
                <div>
                  <Label>Department</Label>
                  <p className="text-sm">{selectedGatepass.department}</p>
                </div>
                <div>
                  <Label>Exit Time</Label>
                  <p className="text-sm">{new Date(selectedGatepass.exit_time).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label>Reason</Label>
                <p className="text-sm">{selectedGatepass.reason}</p>
              </div>
              {selectedGatepass.items_carried && (
                <div>
                  <Label>Items Carried</Label>
                  <p className="text-sm">{selectedGatepass.items_carried}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedGatepass && handleReject(selectedGatepass.id)}
            >
              Reject
            </Button>
            <Button
              onClick={() => selectedGatepass && handleApprove(selectedGatepass.id)}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Exit</DialogTitle>
            <DialogDescription>
              Enter the Gatepass ID to confirm exit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="exitSearch">Gatepass ID</Label>
              <Input
                id="exitSearch"
                placeholder="Enter Gatepass ID (e.g., GP20241201001)"
                value={exitSearchTerm}
                onChange={(e) => setExitSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExit} disabled={!exitSearchTerm}>
              Confirm Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecurityDashboard;