import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, CheckCircle, XCircle, ExternalLink, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Analytics {
  totalGatepasses: number;
  approved: number;
  rejected: number;
  exited: number;
  pending: number;
  totalUsers: number;
  departmentStats: { department: string; count: number }[];
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<Analytics>({
    totalGatepasses: 0,
    approved: 0,
    rejected: 0,
    exited: 0,
    pending: 0,
    totalUsers: 0,
    departmentStats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch gatepass analytics
      const { data: gatepasses, error: gatepassError } = await supabase
        .from('gatepasses')
        .select('status, department');

      if (gatepassError) throw gatepassError;

      // Fetch user count
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('department');

      if (usersError) throw usersError;

      // Calculate analytics
      const statusCounts = gatepasses?.reduce((acc, gatepass) => {
        acc[gatepass.status] = (acc[gatepass.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const departmentStats = gatepasses?.reduce((acc, gatepass) => {
        const existing = acc.find(item => item.department === gatepass.department);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ department: gatepass.department, count: 1 });
        }
        return acc;
      }, [] as { department: string; count: number }[]) || [];

      setAnalytics({
        totalGatepasses: gatepasses?.length || 0,
        approved: (statusCounts.approved || 0) + (statusCounts.issued || 0),
        rejected: statusCounts.rejected || 0,
        exited: statusCounts.exited || 0,
        pending: statusCounts.pending || 0,
        totalUsers: users?.length || 0,
        departmentStats: departmentStats.sort((a, b) => b.count - a.count),
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and analytics</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gatepasses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalGatepasses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalGatepasses > 0 
                ? Math.round((analytics.exited / analytics.totalGatepasses) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gatepass Status Breakdown</CardTitle>
            <CardDescription>Current status distribution of all gatepasses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Approved/Issued</span>
              </div>
              <Badge variant="default">{analytics.approved}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ExternalLink className="h-4 w-4 text-blue-500" />
                <span>Completed (Exited)</span>
              </div>
              <Badge variant="outline">{analytics.exited}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-yellow-500" />
                <span>Pending</span>
              </div>
              <Badge variant="secondary">{analytics.pending}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Rejected</span>
              </div>
              <Badge variant="destructive">{analytics.rejected}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Departments</CardTitle>
            <CardDescription>Departments with most gatepass requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.departmentStats.slice(0, 5).map((dept, index) => (
                <div key={dept.department} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="font-medium">{dept.department}</span>
                  </div>
                  <Badge variant="outline">{dept.count} requests</Badge>
                </div>
              ))}
              {analytics.departmentStats.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;