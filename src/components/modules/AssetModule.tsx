import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Laptop, Package, Plus, Search, Filter, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Asset {
  id: string;
  asset_id: string;
  asset_type: 'laptop' | 'desktop' | 'tablet' | 'phone' | 'monitor' | 'keyboard' | 'mouse' | 'other';
  brand: string | null;
  model: string | null;
  serial_number: string;
  purchase_date: string | null;
  warranty_expiry: string | null;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  current_location: string | null;
  created_at: string;
  updated_at: string;
}

interface AssetAssignment {
  id: string;
  employee_id: string;
  asset_id: string;
  assigned_date: string;
  returned_date: string | null;
  is_active: boolean;
  notes: string | null;
  employee: {
    employee_id: string;
    department: string;
    position: string;
  };
}

export const AssetModule = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newAsset, setNewAsset] = useState({
    asset_type: 'laptop' as const,
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    warranty_expiry: '',
    current_location: '',
  });

  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      fetchAssetAssignments(selectedAsset.id);
    }
  }, [selectedAsset]);

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch assets', variant: 'destructive' });
    } else {
      setAssets((data as Asset[]) || []);
    }
    setLoading(false);
  };

  const fetchAssetAssignments = async (assetId: string) => {
    const { data, error } = await supabase
      .from('employee_assets')
      .select(`
        *,
        employee:employees(employee_id, department, position)
      `)
      .eq('asset_id', assetId)
      .order('assigned_date', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch asset assignments', variant: 'destructive' });
    } else {
      setAssignments((data as any) || []);
    }
  };

  const generateAssetId = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_asset_id');
    if (error) {
      console.error('Error generating asset ID:', error);
      return `AST${Date.now()}`;
    }
    return data;
  };

  const handleAddAsset = async () => {
    if (!newAsset.serial_number) {
      toast({ title: 'Error', description: 'Serial number is required', variant: 'destructive' });
      return;
    }

    const assetId = await generateAssetId();

    const { error } = await supabase
      .from('assets')
      .insert([{
        asset_id: assetId,
        asset_type: newAsset.asset_type,
        brand: newAsset.brand || null,
        model: newAsset.model || null,
        serial_number: newAsset.serial_number,
        purchase_date: newAsset.purchase_date || null,
        warranty_expiry: newAsset.warranty_expiry || null,
        current_location: newAsset.current_location || null,
        status: 'available',
      }]);

    if (error) {
      toast({ title: 'Error', description: 'Failed to add asset', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Asset added successfully' });
      setShowAddAsset(false);
      setNewAsset({
        asset_type: 'laptop',
        brand: '',
        model: '',
        serial_number: '',
        purchase_date: '',
        warranty_expiry: '',
        current_location: '',
      });
      fetchAssets();
    }
  };

  const updateAssetStatus = async (assetId: string, newStatus: string) => {
    const { error } = await supabase
      .from('assets')
      .update({ status: newStatus })
      .eq('id', assetId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update asset status', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Asset status updated successfully' });
      fetchAssets();
      if (selectedAsset?.id === assetId) {
        setSelectedAsset({ ...selectedAsset, status: newStatus as any });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'assigned': return 'bg-blue-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'retired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'laptop':
      case 'desktop':
      case 'tablet':
        return <Laptop className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesType = typeFilter === 'all' || asset.asset_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Asset Management</h2>
        {profile?.role === 'admin' && (
          <Dialog open={showAddAsset} onOpenChange={setShowAddAsset}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="asset_type">Asset Type</Label>
                  <Select value={newAsset.asset_type} onValueChange={(value: any) => setNewAsset({ ...newAsset, asset_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="monitor">Monitor</SelectItem>
                      <SelectItem value="keyboard">Keyboard</SelectItem>
                      <SelectItem value="mouse">Mouse</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={newAsset.brand}
                      onChange={(e) => setNewAsset({ ...newAsset, brand: e.target.value })}
                      placeholder="Dell, Apple, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={newAsset.model}
                      onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                      placeholder="XPS 13, MacBook Pro, etc."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="serial_number">Serial Number *</Label>
                  <Input
                    id="serial_number"
                    value={newAsset.serial_number}
                    onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })}
                    placeholder="ABC123XYZ"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={newAsset.purchase_date}
                      onChange={(e) => setNewAsset({ ...newAsset, purchase_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                    <Input
                      id="warranty_expiry"
                      type="date"
                      value={newAsset.warranty_expiry}
                      onChange={(e) => setNewAsset({ ...newAsset, warranty_expiry: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="current_location">Location</Label>
                  <Input
                    id="current_location"
                    value={newAsset.current_location}
                    onChange={(e) => setNewAsset({ ...newAsset, current_location: e.target.value })}
                    placeholder="Office floor, room number, etc."
                  />
                </div>
                <Button onClick={handleAddAsset} className="w-full">
                  Add Asset
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
            placeholder="Search assets..."
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
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="laptop">Laptop</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="monitor">Monitor</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Assets ({filteredAssets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading assets...</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAsset?.id === asset.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        {getTypeIcon(asset.asset_type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{asset.asset_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {asset.brand} {asset.model} • {asset.asset_type}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          SN: {asset.serial_number}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`${getStatusColor(asset.status)} text-white`}>
                            {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                          </Badge>
                          {asset.warranty_expiry && (
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              Warranty: {new Date(asset.warranty_expiry).toLocaleDateString()}
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
              Asset Details & History
              {selectedAsset && profile?.role === 'admin' && (
                <div className="ml-auto flex gap-2">
                  <Select value={selectedAsset.status} onValueChange={(value) => updateAssetStatus(selectedAsset.id, value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAsset ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Asset Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Asset ID:</span> {selectedAsset.asset_id}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {selectedAsset.asset_type}
                    </div>
                    <div>
                      <span className="font-medium">Brand:</span> {selectedAsset.brand || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Model:</span> {selectedAsset.model || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Serial:</span> {selectedAsset.serial_number}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> 
                      <Badge variant="outline" className={`ml-2 ${getStatusColor(selectedAsset.status)} text-white`}>
                        {selectedAsset.status}
                      </Badge>
                    </div>
                    {selectedAsset.purchase_date && (
                      <div>
                        <span className="font-medium">Purchased:</span> {new Date(selectedAsset.purchase_date).toLocaleDateString()}
                      </div>
                    )}
                    {selectedAsset.warranty_expiry && (
                      <div>
                        <span className="font-medium">Warranty:</span> {new Date(selectedAsset.warranty_expiry).toLocaleDateString()}
                      </div>
                    )}
                    {selectedAsset.current_location && (
                      <div className="col-span-2">
                        <span className="font-medium">Location:</span> {selectedAsset.current_location}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Assignment History</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {assignments.length > 0 ? (
                      assignments.map((assignment) => (
                        <div key={assignment.id} className="p-2 border rounded text-sm">
                          <div className="font-medium">{assignment.employee.employee_id}</div>
                          <div className="text-muted-foreground">
                            {assignment.employee.department} • {assignment.employee.position}
                          </div>
                          <div className="text-muted-foreground">
                            Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                            {assignment.returned_date && (
                              <span> • Returned: {new Date(assignment.returned_date).toLocaleDateString()}</span>
                            )}
                          </div>
                          {assignment.notes && (
                            <div className="text-muted-foreground">Notes: {assignment.notes}</div>
                          )}
                          <Badge variant={assignment.is_active ? "default" : "secondary"}>
                            {assignment.is_active ? "Active" : "Returned"}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        No assignment history found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Select an asset to view details and history
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};