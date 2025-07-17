import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'security_officer':
        return 'default';
      case 'staff':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'security_officer':
        return 'Security Officer';
      case 'admin':
        return 'Admin';
      case 'staff':
        return 'Staff';
      default:
        return role;
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Siginon Global</h1>
          <span className="text-sm text-muted-foreground">Gatepass System</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{profile?.full_name}</span>
                <Badge variant={getRoleBadgeVariant(profile?.role || '')}>
                  {getRoleDisplayName(profile?.role || '')}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  <p className="text-xs text-muted-foreground">{profile?.department}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;