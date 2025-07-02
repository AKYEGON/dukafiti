import { Link, useLocation } from "wouter";
import { Store, BarChart3, Package, Users, FileText, Settings, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Sales", href: "/sales", icon: BarChart3 },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

const getPageTitle = (location: string) => {
  const page = navigation.find(item => item.href === location);
  if (page) return page.name;
  if (location === "/" || location === "/dashboard") return "Dashboard";
  return "DukaSmart";
};

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
}

export function Sidebar({ className, collapsed = false }: SidebarProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pageTitle = getPageTitle(location);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const SidebarContent = ({ isCollapsed = false, isMobile = false }) => (
    <>
      {/* Logo and branding */}
      <div className={cn(
        "border-b border-sidebar-border transition-all duration-300",
        isCollapsed && !isMobile ? "p-2" : "p-4 sm:p-6"
      )}>
        <div className="flex items-center justify-between">
          <div className={cn(
            "flex items-center transition-all duration-300",
            isCollapsed && !isMobile ? "space-x-0 justify-center" : "space-x-3"
          )}>
            <div className="w-10 h-10 bg-primaryPurple rounded-lg flex items-center justify-center">
              <Store className="text-white" size={20} />
            </div>
            <div className={cn(
              "transition-all duration-300",
              isCollapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}>
              <h1 className="text-xl font-bold text-sidebar-foreground">DukaSmart</h1>
              <p className="text-sidebar-foreground/70 text-sm">Business Platform</p>
            </div>
          </div>
          

          
          {/* Mobile close button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground hover:bg-sidebar-accent h-12 w-12"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={24} />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-1 transition-all duration-300 overflow-y-auto",
        isCollapsed && !isMobile ? "p-2" : "p-2 sm:p-4"
      )}>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center rounded-lg transition-all duration-300 cursor-pointer text-base leading-relaxed",
                  isCollapsed && !isMobile 
                    ? "p-3 justify-center h-12" 
                    : "p-4 space-x-3 h-12",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
                title={isCollapsed && !isMobile ? item.name : undefined}
              >
                <Icon size={24} className="flex-shrink-0" />
                <span className={cn(
                  "font-medium transition-all duration-300",
                  isCollapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile sticky header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-2 sm:px-4 py-3 h-16">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-12 w-12 hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
          </div>
          <div className="w-10 h-10 bg-primaryPurple rounded-lg flex items-center justify-center">
            <Store className="text-white" size={20} />
          </div>
        </div>
      </div>

      {/* Desktop sidebar with collapsible animation */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out flex-shrink-0 h-full overflow-hidden border-r border-sidebar-border",
        collapsed ? "w-16" : "w-64",
        className
      )}>
        <SidebarContent isCollapsed={collapsed} />
      </aside>

      {/* Mobile sidebar overlay with slide animation */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden transition-all duration-300",
        isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )}>
        {/* Backdrop */}
        <div 
          className={cn(
            "fixed inset-0 bg-black transition-opacity duration-300",
            isMobileMenuOpen ? "bg-opacity-50" : "bg-opacity-0"
          )}
          onClick={() => setIsMobileMenuOpen(false)} 
        />
        
        {/* Drawer */}
        <aside className={cn(
          "fixed left-0 top-0 h-full w-80 bg-sidebar text-sidebar-foreground z-50 shadow-2xl transition-transform duration-300 ease-in-out border-r border-sidebar-border",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <SidebarContent isMobile={true} />
        </aside>
      </div>
    </>
  );
}
