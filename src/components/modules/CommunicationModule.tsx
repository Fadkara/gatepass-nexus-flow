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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Send, Plus, Search, AlertTriangle, Info, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Communication {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  recipient_type: 'individual' | 'department' | 'all_staff' | 'all_visitors';
  recipient_department: string | null;
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  communication_type: 'message' | 'announcement' | 'alert' | 'notification';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
  recipient?: {
    full_name: string;
    email: string;
  };
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department: string;
  role: string;
}

export const CommunicationModule = () => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [sentCommunications, setSentCommunications] = useState<Communication[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState<{
    recipient_id: string;
    recipient_type: 'individual' | 'department' | 'all_staff';
    recipient_department: string;
    subject: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    communication_type: 'message' | 'announcement' | 'alert' | 'notification';
  }>({
    recipient_id: '',
    recipient_type: 'individual',
    recipient_department: '',
    subject: '',
    message: '',
    priority: 'normal',
    communication_type: 'message',
  });

  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunications();
    fetchSentCommunications();
    fetchProfiles();
    fetchDepartments();
  }, []);

  const fetchCommunications = async () => {
    const { data, error } = await supabase
      .from('communications')
      .select(`
        *,
        sender:profiles!communications_sender_id_fkey(full_name, email)
      `)
      .or(`recipient_id.eq.${profile?.user_id},recipient_type.eq.all_staff,and(recipient_type.eq.department,recipient_department.eq.${profile?.department})`)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch communications', variant: 'destructive' });
    } else {
      setCommunications((data as any) || []);
    }
    setLoading(false);
  };

  const fetchSentCommunications = async () => {
    const { data, error } = await supabase
      .from('communications')
      .select(`
        *,
        recipient:profiles!communications_recipient_id_fkey(full_name, email)
      `)
      .eq('sender_id', profile?.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch sent communications', variant: 'destructive' });
    } else {
      setSentCommunications((data as any) || []);
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch profiles', variant: 'destructive' });
    } else {
      setProfiles(data || []);
    }
  };

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('department')
      .neq('department', null);

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch departments', variant: 'destructive' });
    } else {
      const uniqueDepartments = [...new Set(data?.map(p => p.department).filter(Boolean))];
      setDepartments(uniqueDepartments);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.subject || !newMessage.message) {
      toast({ title: 'Error', description: 'Please fill in subject and message', variant: 'destructive' });
      return;
    }

    if (newMessage.recipient_type === 'individual' && !newMessage.recipient_id) {
      toast({ title: 'Error', description: 'Please select a recipient', variant: 'destructive' });
      return;
    }

    if (newMessage.recipient_type === 'department' && !newMessage.recipient_department) {
      toast({ title: 'Error', description: 'Please select a department', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('communications')
      .insert([{
        sender_id: profile?.user_id,
        recipient_id: newMessage.recipient_type === 'individual' ? newMessage.recipient_id : null,
        recipient_type: newMessage.recipient_type,
        recipient_department: newMessage.recipient_type === 'department' ? newMessage.recipient_department : null,
        subject: newMessage.subject,
        message: newMessage.message,
        priority: newMessage.priority,
        communication_type: newMessage.communication_type,
      }]);

    if (error) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Message sent successfully' });
      setShowCompose(false);
      setNewMessage({
        recipient_id: '',
        recipient_type: 'individual',
        recipient_department: '',
        subject: '',
        message: '',
        priority: 'normal',
        communication_type: 'message',
      });
      fetchCommunications();
      fetchSentCommunications();
    }
  };

  const markAsRead = async (communicationId: string) => {
    const { error } = await supabase
      .from('communications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', communicationId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to mark as read', variant: 'destructive' });
    } else {
      fetchCommunications();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'normal': return <Info className="h-4 w-4" />;
      case 'low': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <MessageCircle className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'notification': return <Info className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const filteredCommunications = communications.filter(comm =>
    comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comm.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comm.sender?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSentCommunications = sentCommunications.filter(comm =>
    comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comm.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comm.recipient?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Communications</h2>
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compose New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient_type">Recipient Type</Label>
                  <Select value={newMessage.recipient_type} onValueChange={(value: any) => setNewMessage({ ...newMessage, recipient_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="all_staff">All Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="communication_type">Type</Label>
                  <Select value={newMessage.communication_type} onValueChange={(value: any) => setNewMessage({ ...newMessage, communication_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="message">Message</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newMessage.recipient_type === 'individual' && (
                <div>
                  <Label htmlFor="recipient">Recipient</Label>
                  <Select value={newMessage.recipient_id} onValueChange={(value) => setNewMessage({ ...newMessage, recipient_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.user_id}>
                          {profile.full_name} - {profile.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newMessage.recipient_type === 'department' && (
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={newMessage.recipient_department} onValueChange={(value) => setNewMessage({ ...newMessage, recipient_department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newMessage.priority} onValueChange={(value: any) => setNewMessage({ ...newMessage, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  placeholder="Enter subject"
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  placeholder="Enter your message"
                  rows={6}
                />
              </div>

              <Button onClick={handleSendMessage} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search communications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inbox">Inbox ({communications.filter(c => !c.is_read).length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({sentCommunications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading communications...</div>
          ) : filteredCommunications.length > 0 ? (
            filteredCommunications.map((comm) => (
              <Card key={comm.id} className={`cursor-pointer transition-colors ${!comm.is_read ? 'bg-primary/5 border-primary/20' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {comm.sender?.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{comm.sender?.full_name}</span>
                          <Badge variant="outline" className={`${getPriorityColor(comm.priority)} text-white`}>
                            {getPriorityIcon(comm.priority)}
                            <span className="ml-1 capitalize">{comm.priority}</span>
                          </Badge>
                          <Badge variant="outline">
                            {getTypeIcon(comm.communication_type)}
                            <span className="ml-1 capitalize">{comm.communication_type}</span>
                          </Badge>
                          {!comm.is_read && (
                            <Badge>New</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold mb-1">{comm.subject}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{comm.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(comm.created_at).toLocaleString()}
                          </span>
                          <span>
                            To: {comm.recipient_type === 'individual' ? comm.recipient?.full_name : 
                                 comm.recipient_type === 'department' ? comm.recipient_department :
                                 'All Staff'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!comm.is_read && (
                      <Button size="sm" variant="outline" onClick={() => markAsRead(comm.id)}>
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No communications found
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {filteredSentCommunications.length > 0 ? (
            filteredSentCommunications.map((comm) => (
              <Card key={comm.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">To: {
                          comm.recipient_type === 'individual' ? comm.recipient?.full_name : 
                          comm.recipient_type === 'department' ? comm.recipient_department :
                          'All Staff'
                        }</span>
                        <Badge variant="outline" className={`${getPriorityColor(comm.priority)} text-white`}>
                          {getPriorityIcon(comm.priority)}
                          <span className="ml-1 capitalize">{comm.priority}</span>
                        </Badge>
                        <Badge variant="outline">
                          {getTypeIcon(comm.communication_type)}
                          <span className="ml-1 capitalize">{comm.communication_type}</span>
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{comm.subject}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{comm.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(comm.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No sent communications found
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};