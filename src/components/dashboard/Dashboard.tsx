import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import SecurityDashboard from './SecurityDashboard';
import StaffDashboard from './StaffDashboard';

const Dashboard = () => {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'security_officer':
      return <SecurityDashboard />;
    case 'staff':
      return <StaffDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Unknown Role</h1>
            <p className="text-muted-foreground">Your account role is not recognized.</p>
          </div>
        </div>
      );
  }
};

export default Dashboard;