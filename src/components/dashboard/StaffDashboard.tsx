import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CreateGatepassDialog from '../gatepass/CreateGatepassDialog';

interface Gatepass {
  id: string;
  gatepass_id: string;
  reason: string;
  items_carried: string | null;
  exit_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'issued' | 'exited';
  created_at: string;
}

const StaffDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [gatepasses, setGatepasses] = useState<Gatepass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchGatepasses();
  }, []);

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
        return <FileText className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold">My Gatepasses</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.full_name} • {profile?.department}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gatepasses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
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
            <div className="text-2xl font-bold">{(statusCounts.approved || 0) + (statusCounts.issued || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.exited || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gatepasses List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>Your gatepass requests and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gatepasses.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No gatepasses</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get started by creating a new gatepass request.
                </p>
              </div>
            ) : (
              gatepasses.map((gatepass) => (
                <div key={gatepass.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(gatepass.status)}
                    <div>
                      <div className="font-medium">{gatepass.gatepass_id}</div>
                      <div className="text-sm text-muted-foreground">{gatepass.reason}</div>
                      <div className="text-xs text-muted-foreground">
                        Exit: {new Date(gatepass.exit_time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusVariant(gatepass.status)}>
                      {gatepass.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(gatepass.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CreateGatepassDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchGatepasses}
      />
    </div>
  );
};

export default StaffDashboard;