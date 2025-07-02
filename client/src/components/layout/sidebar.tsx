import { Link, useLocation } from "wouter";
import { Store, BarChart3, Package, Users, FileText, Settings, Menu, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pageTitle = getPageTitle(location);

  const SidebarContent = () => (
    <>
      {/* Logo and branding */}
      <div className="p-4 sm:p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Store className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">DukaSmart</h1>
              <p className="text-gray-400 text-sm">Business Platform</p>
            </div>
          </div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-gray-800 h-12 w-12"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-2 sm:p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg transition-colors cursor-pointer text-base leading-relaxed h-12",
                  isActive
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={24} />
                <span className="font-medium">{item.name}</span>
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
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Store className="text-white" size={20} />
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className={cn("hidden lg:block bg-gray-900 text-white w-64 min-h-screen", className)}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-80 bg-gray-900 text-white z-50 shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
