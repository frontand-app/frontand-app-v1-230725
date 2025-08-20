
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
import { Github, Menu, X, User, LogOut, Settings, CreditCard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  // V1 Navigation - core workflows
  const navigation = [
  { name: "Home", href: "/" },
  { name: "Search", href: "/search" },
      { name: "Loop Over Rows", href: "/search/loop-over-rows" },
    { name: "Crawl4Imprint", href: "/search/crawl4imprint" },
  { name: "Executions", href: "/executions" },
  { name: "Developer", href: "/developer" },
];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  // Always show layout, including on /auth (so the page has header/footer)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src="/Front&_Logo.svg" alt="Front&" className="h-8" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-foreground ${
                    isActive(item.href)
                      ? "text-foreground"
                      : "text-muted-foreground"
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
                  href="https://github.com/frontand-app/frontand-platform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
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
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="w-full cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
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
                <Button variant="outline" className="bg-primary text-primary-foreground border-primary hover:bg-primary/90 rounded-full px-6" asChild>
                  <Link to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`}>Sign In</Link>
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
            <div className="md:hidden border-t py-4">
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary"
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
                      className="flex items-center space-x-2 text-muted-foreground hover:text-primary"
                    >
                      <Github className="w-4 h-4" />
                      <span>GitHub</span>
                    </a>
                  </Button>
                  
                  {user ? (
                    <div className="space-y-2">
                      <div className="px-3 py-2 text-sm text-muted-foreground">
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
                    <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                      <Link to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`}>Sign In</Link>
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
      <footer className="border-t bg-secondary mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center">
                <img src="/Front&_Logo.svg" alt="Front&" className="h-6" />
              </Link>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a href="https://github.com/frontand-app/frontand-platform" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                GitHub
              </a>
              <span className="sr-only">© 2025 Front&</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
