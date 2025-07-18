import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Users, Plus, Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Visitor {
  id: string;
  visitor_id: string;
  full_name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  face_encoding: string | null;
  purpose_of_visit: string;
  host_employee_id: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  expected_checkout: string | null;
  status: 'pending' | 'checked_in' | 'checked_out' | 'expired';
  created_at: string;
  updated_at: string;
}

interface Employee {
  id: string;
  employee_id: string;
  department: string;
  position: string;
}

export const VisitorModule = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showAddVisitor, setShowAddVisitor] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    full_name: '',
    company: '',
    phone: '',
    email: '',
    purpose_of_visit: '',
    host_employee_id: '',
    expected_checkout: '',
  });

  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchVisitors();
    fetchEmployees();
  }, []);

  const fetchVisitors = async () => {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch visitors', variant: 'destructive' });
    } else {
      setVisitors((data as Visitor[]) || []);
    }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('id, employee_id, department, position')
      .eq('is_active', true)
      .order('employee_id');

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch employees', variant: 'destructive' });
    } else {
      setEmployees(data || []);
    }
  };

  const generateVisitorId = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_visitor_id');
    if (error) {
      console.error('Error generating visitor ID:', error);
      return `VIS${Date.now()}`;
    }
    return data;
  };

  const handleAddVisitor = async () => {
    if (!newVisitor.full_name || !newVisitor.purpose_of_visit) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    const visitorId = await generateVisitorId();

    const { error } = await supabase
      .from('visitors')
      .insert([{
        visitor_id: visitorId,
        full_name: newVisitor.full_name,
        company: newVisitor.company || null,
        phone: newVisitor.phone || null,
        email: newVisitor.email || null,
        purpose_of_visit: newVisitor.purpose_of_visit,
        host_employee_id: newVisitor.host_employee_id || null,
        expected_checkout: newVisitor.expected_checkout || null,
        status: 'pending',
      }]);

    if (error) {
      toast({ title: 'Error', description: 'Failed to add visitor', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Visitor added successfully' });
      setShowAddVisitor(false);
      setNewVisitor({
        full_name: '',
        company: '',
        phone: '',
        email: '',
        purpose_of_visit: '',
        host_employee_id: '',
        expected_checkout: '',
      });
      fetchVisitors();
    }
  };

  const handleCheckIn = async (visitorId: string) => {
    const { error } = await supabase
      .from('visitors')
      .update({
        status: 'checked_in',
        check_in_time: new Date().toISOString(),
      })
      .eq('id', visitorId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to check in visitor', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Visitor checked in successfully' });
      fetchVisitors();
    }
  };

  const handleCheckOut = async (visitorId: string) => {
    const { error } = await supabase
      .from('visitors')
      .update({
        status: 'checked_out',
        check_out_time: new Date().toISOString(),
      })
      .eq('id', visitorId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to check out visitor', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Visitor checked out successfully' });
      fetchVisitors();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'checked_in': return 'bg-green-500';
      case 'checked_out': return 'bg-blue-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'checked_in': return <CheckCircle className="h-4 w-4" />;
      case 'checked_out': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = 
      visitor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.visitor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.purpose_of_visit.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || visitor.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Visitor Management</h2>
        {(profile?.role === 'admin' || profile?.role === 'security_officer') && (
          <Dialog open={showAddVisitor} onOpenChange={setShowAddVisitor}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Register Visitor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Register New Visitor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={newVisitor.full_name}
                    onChange={(e) => setNewVisitor({ ...newVisitor, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={newVisitor.company}
                    onChange={(e) => setNewVisitor({ ...newVisitor, company: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newVisitor.phone}
                    onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newVisitor.email}
                    onChange={(e) => setNewVisitor({ ...newVisitor, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="purpose">Purpose of Visit *</Label>
                  <Textarea
                    id="purpose"
                    value={newVisitor.purpose_of_visit}
                    onChange={(e) => setNewVisitor({ ...newVisitor, purpose_of_visit: e.target.value })}
                    placeholder="Meeting, Interview, Delivery, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="host">Host Employee</Label>
                  <Select value={newVisitor.host_employee_id} onValueChange={(value) => setNewVisitor({ ...newVisitor, host_employee_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select host employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.employee_id} - {employee.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expected_checkout">Expected Check-out</Label>
                  <Input
                    id="expected_checkout"
                    type="datetime-local"
                    value={newVisitor.expected_checkout}
                    onChange={(e) => setNewVisitor({ ...newVisitor, expected_checkout: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddVisitor} className="w-full">
                  Register Visitor
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search visitors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">Loading visitors...</div>
        ) : filteredVisitors.length > 0 ? (
          filteredVisitors.map((visitor) => (
            <Card key={visitor.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {visitor.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{visitor.full_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{visitor.visitor_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${getStatusColor(visitor.status)} text-white`}>
                      {getStatusIcon(visitor.status)}
                      <span className="ml-1 capitalize">{visitor.status.replace('_', ' ')}</span>
                    </Badge>
                    {visitor.face_encoding && (
                      <Badge variant="outline">
                        <Camera className="h-3 w-3 mr-1" />
                        Face ID
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {visitor.company && (
                  <div className="text-sm">
                    <span className="font-medium">Company:</span> {visitor.company}
                  </div>
                )}
                {visitor.phone && (
                  <div className="text-sm">
                    <span className="font-medium">Phone:</span> {visitor.phone}
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">Purpose:</span> {visitor.purpose_of_visit}
                </div>
                {visitor.check_in_time && (
                  <div className="text-sm">
                    <span className="font-medium">Check-in:</span> {new Date(visitor.check_in_time).toLocaleString()}
                  </div>
                )}
                {visitor.check_out_time && (
                  <div className="text-sm">
                    <span className="font-medium">Check-out:</span> {new Date(visitor.check_out_time).toLocaleString()}
                  </div>
                )}
                {visitor.expected_checkout && (
                  <div className="text-sm">
                    <span className="font-medium">Expected out:</span> {new Date(visitor.expected_checkout).toLocaleString()}
                  </div>
                )}

                {(profile?.role === 'admin' || profile?.role === 'security_officer') && (
                  <div className="flex gap-2 pt-2">
                    {visitor.status === 'pending' && (
                      <Button size="sm" onClick={() => handleCheckIn(visitor.id)} className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check In
                      </Button>
                    )}
                    {visitor.status === 'checked_in' && (
                      <Button size="sm" variant="outline" onClick={() => handleCheckOut(visitor.id)} className="flex-1">
                        <XCircle className="h-4 w-4 mr-2" />
                        Check Out
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No visitors found matching your search criteria
          </div>
        )}
      </div>
    </div>
  );
};