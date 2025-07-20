
import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Github, Menu, X, User, LogOut, Settings, CreditCard, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CreditsService, UserProfile } from "@/lib/credits";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const location = useLocation();
  const { user, signOut } = useAuth();

  // Load user profile when user changes
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        const profile = await CreditsService.getUserProfile(user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    };
    
    loadUserProfile();
  }, [user]);

  // V1 Simplified Navigation - focus on single workflow
  const navigation = [
    { name: "Home", href: "/" },
    { name: "Loop Over Rows", href: "/flows/loop-over-rows" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  // Don't show layout on auth page
  if (location.pathname === '/auth') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F&</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Front&</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                    isActive(item.href)
                      ? "text-primary-600"
                      : "text-gray-700"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <a
                  href="https://github.com/frontand-app/frontand-app-v1-clean"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
              </Button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                      <User className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm text-gray-900">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {userProfile ? (
                            `${userProfile.tier.charAt(0).toUpperCase() + userProfile.tier.slice(1)} Plan • ${userProfile.credits_balance.toFixed(0)} credits`
                          ) : (
                            'Loading...'
                          )}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="w-full cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/billing" className="w-full cursor-pointer">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Billing & Usage
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="w-full cursor-pointer text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" className="bg-primary-500 hover:bg-primary-600 text-white" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                      isActive(item.href)
                        ? "text-primary-600 bg-primary-50"
                        : "text-gray-700 hover:text-primary-600"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                
                <div className="border-t pt-4">
                  <Button variant="ghost" size="sm" className="w-full justify-start mb-2" asChild>
                    <a
                      href="https://github.com/frontand-app/frontand-app-v1-clean"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-gray-700 hover:text-primary-600"
                    >
                      <Github className="w-4 h-4" />
                      <span>GitHub</span>
                    </a>
                  </Button>
                  
                  {user ? (
                    <div className="space-y-2">
                      <div className="px-3 py-2 text-sm text-gray-700">
                        {user.email}
                      </div>
                      <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                        <Link to="/dashboard">
                          <Settings className="w-4 h-4 mr-2" />
                          Account Settings
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full bg-primary-500 hover:bg-primary-600 text-white" asChild>
                      <Link to="/auth">Sign In</Link>
                    </Button>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* V1 Simplified Footer */}
      <footer className="border-t bg-gray-50 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F&</span>
                </div>
                <span className="font-bold text-gray-900">Front&</span>
              </Link>
              <span className="text-sm text-gray-600">One frontend, infinite cloud apps</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <a href="https://github.com/frontand-app/frontand-app-v1-clean" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
                GitHub
              </a>
              <span>© 2024 Front&</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/flows" className="hover:text-gray-900">Flow Library</Link></li>
                <li><Link to="/dashboard" className="hover:text-gray-900">Dashboard</Link></li>
                <li><Link to="/creators" className="hover:text-gray-900">Creator Dashboard</Link></li>
                <li><Link to="/billing" className="hover:text-gray-900">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/docs" className="hover:text-gray-900">Documentation</Link></li>
                <li><Link to="/docs" className="hover:text-gray-900">API Reference</Link></li>
                <li><a href="https://github.com/closedai/closedai/discussions" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/about" className="hover:text-gray-900">About</Link></li>
                <li><a href="https://github.com/closedai/closedai" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">Blog</a></li>
                <li><a href="https://github.com/closedai" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">GitHub</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8">
            <p className="text-sm text-gray-600 text-center">
              © 2024 Front&. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
