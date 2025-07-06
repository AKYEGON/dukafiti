import { Link, useLocation } from "wouter";
import { Store, BarChart3, Package, Users, FileText, Settings, Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  return "DukaFiti";
};

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  toggleSidebar?: () => void;
}

export function Sidebar({ className, collapsed = false, toggleSidebar }: SidebarProps) {
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
    <div className="flex flex-col justify-between h-screen">
      {/* Top section with logo and navigation */}
      <div className="flex flex-col">
        {/* Store logo/name mini-header */}
        <div className={cn(
          "p-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-700",
          isCollapsed && !isMobile ? "px-2" : "px-4"
        )}>
          {isCollapsed && !isMobile ? (
            <Link href="/">
              <img 
                src="/assets/logo-icon.svg" 
                alt="DukaFiti" 
                className="w-10 h-10 hover:scale-105 transition-transform duration-200"
              />
            </Link>
          ) : (
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200">
              <img 
                src="/assets/logo-icon.svg" 
                alt="DukaFiti Icon" 
                className="w-10 h-10"
              />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">DukaFiti</h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Duka Bora ni Duka Fiti</p>
              </div>
            </Link>
          )}
          
          {/* Mobile close button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-10 w-10"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={20} />
            </Button>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-4" />

        {/* Navigation links */}
        <nav className={cn(
          "space-y-2 flex-1",
          isCollapsed && !isMobile ? "px-2" : "px-4"
        )}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                    isCollapsed && !isMobile ? "justify-center w-12 mx-auto" : "",
                    isActive
                      ? "bg-brand text-white"
                      : "bg-transparent text-neutral-800 dark:text-neutral-200 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900 dark:hover:text-brand-200"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                  title={isCollapsed && !isMobile ? item.name : undefined}
                >
                  <Icon 
                    className={cn(
                      "w-6 h-6 flex-shrink-0",
                      isActive ? "text-white" : "text-brand-600"
                    )} 
                  />
                  {(!isCollapsed || isMobile) && (
                    <span className="flex-1 text-base font-medium">
                      {item.name}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom section with collapse toggle */}
      {!isMobile && toggleSidebar && (
        <div className="p-4">
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors duration-200 mx-auto"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-brand-600" />
            ) : (
              <PanelLeftClose className="w-5 h-5 text-brand-600" />
            )}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile sticky header - visible on mobile and tablet when sidebar is hidden */}
      <div className="md:hidden sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3 h-16">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">{pageTitle}</h1>
          </div>
          <img 
            src="/assets/logo-icon.svg" 
            alt="DukaFiti" 
            className="w-10 h-10"
          />
        </div>
      </div>

      {/* Desktop and Tablet sidebar with collapsible animation */}
      <aside className={cn(
        "hidden md:flex flex-col bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out flex-shrink-0 h-screen overflow-hidden border-r border-gray-200 dark:border-gray-700",
        collapsed ? "w-16" : "w-64",
        className
      )}>
        <SidebarContent isCollapsed={collapsed} />
      </aside>

      {/* Mobile and Tablet sidebar overlay with slide animation */}
      <div className={cn(
        "fixed inset-0 z-50 md:hidden transition-all duration-300",
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
        
        {/* Mobile Drawer */}
        <aside className={cn(
          "fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 z-50 shadow-2xl transition-transform duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <SidebarContent isMobile={true} />
        </aside>
      </div>
    </>
  );
}
