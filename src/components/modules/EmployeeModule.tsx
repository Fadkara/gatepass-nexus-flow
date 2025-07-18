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
import { Camera, Laptop, User, Plus, Search, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  employee_id: string;
  user_id: string;
  department: string;
  position: string;
  hire_date: string;
  is_active: boolean;
  face_encoding: string | null;
  created_at: string;
  updated_at: string;
}

interface Asset {
  id: string;
  asset_id: string;
  asset_type: string;
  brand: string;
  model: string;
  serial_number: string;
  status: string;
  current_location: string;
}

interface EmployeeAsset {
  id: string;
  employee_id: string;
  asset_id: string;
  assigned_date: string;
  is_active: boolean;
  notes: string;
  asset: Asset;
}

export const EmployeeModule = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeAssets, setEmployeeAssets] = useState<EmployeeAsset[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAssignAsset, setShowAssignAsset] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    employee_id: '',
    department: '',
    position: '',
    hire_date: '',
  });
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchAvailableAssets();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeAssets(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch employees', variant: 'destructive' });
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  const fetchEmployeeAssets = async (employeeId: string) => {
    const { data, error } = await supabase
      .from('employee_assets')
      .select(`
        *,
        asset:assets(*)
      `)
      .eq('employee_id', employeeId)
      .eq('is_active', true);

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch employee assets', variant: 'destructive' });
    } else {
      setEmployeeAssets(data || []);
    }
  };

  const fetchAvailableAssets = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'available')
      .order('asset_id');

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch available assets', variant: 'destructive' });
    } else {
      setAvailableAssets(data || []);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.employee_id || !newEmployee.department) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }

    const { data, error } = await supabase
      .from('employees')
      .insert([{
        employee_id: newEmployee.employee_id,
        user_id: '', // This would need to be linked to an actual user
        department: newEmployee.department,
        position: newEmployee.position,
        hire_date: newEmployee.hire_date || null,
      }]);

    if (error) {
      toast({ title: 'Error', description: 'Failed to add employee', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Employee added successfully' });
      setShowAddEmployee(false);
      setNewEmployee({ employee_id: '', department: '', position: '', hire_date: '' });
      fetchEmployees();
    }
  };

  const handleAssignAsset = async () => {
    if (!selectedEmployee || !selectedAssetId) {
      toast({ title: 'Error', description: 'Please select an asset', variant: 'destructive' });
      return;
    }

    const { error: assignError } = await supabase
      .from('employee_assets')
      .insert([{
        employee_id: selectedEmployee.id,
        asset_id: selectedAssetId,
        assigned_by: profile?.user_id,
        notes: assignmentNotes,
      }]);

    if (assignError) {
      toast({ title: 'Error', description: 'Failed to assign asset', variant: 'destructive' });
      return;
    }

    // Update asset status
    const { error: updateError } = await supabase
      .from('assets')
      .update({ status: 'assigned' })
      .eq('id', selectedAssetId);

    if (updateError) {
      toast({ title: 'Error', description: 'Failed to update asset status', variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Asset assigned successfully' });
    setShowAssignAsset(false);
    setSelectedAssetId('');
    setAssignmentNotes('');
    fetchEmployeeAssets(selectedEmployee.id);
    fetchAvailableAssets();
  };

  const filteredEmployees = employees.filter(employee =>
    employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Management</h2>
        {profile?.role === 'admin' && (
          <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    value={newEmployee.employee_id}
                    onChange={(e) => setNewEmployee({ ...newEmployee, employee_id: e.target.value })}
                    placeholder="EMP20250101001"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    placeholder="IT, HR, Finance, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    placeholder="Developer, Manager, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={newEmployee.hire_date}
                    onChange={(e) => setNewEmployee({ ...newEmployee, hire_date: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddEmployee} className="w-full">
                  Add Employee
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
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading employees...</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEmployee?.id === employee.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {employee.employee_id.slice(-3)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{employee.employee_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.department} {employee.position && `• ${employee.position}`}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={employee.is_active ? "default" : "secondary"}>
                            {employee.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {employee.face_encoding && (
                            <Badge variant="outline">
                              <Camera className="h-3 w-3 mr-1" />
                              Face ID
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              Assigned Assets
              {selectedEmployee && profile?.role === 'admin' && (
                <Dialog open={showAssignAsset} onOpenChange={setShowAssignAsset}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="ml-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Asset
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Asset to {selectedEmployee.employee_id}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="asset">Select Asset</Label>
                        <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an asset" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAssets.map((asset) => (
                              <SelectItem key={asset.id} value={asset.id}>
                                {asset.asset_id} - {asset.asset_type} ({asset.brand} {asset.model})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={assignmentNotes}
                          onChange={(e) => setAssignmentNotes(e.target.value)}
                          placeholder="Assignment notes..."
                        />
                      </div>
                      <Button onClick={handleAssignAsset} className="w-full">
                        Assign Asset
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEmployee ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {employeeAssets.length > 0 ? (
                  employeeAssets.map((assignment) => (
                    <div key={assignment.id} className="p-3 border rounded-lg">
                      <div className="font-medium">{assignment.asset.asset_id}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.asset.asset_type} • {assignment.asset.brand} {assignment.asset.model}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Serial: {assignment.asset.serial_number}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                      </div>
                      {assignment.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Notes: {assignment.notes}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No assets assigned to this employee
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Select an employee to view their assigned assets
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};