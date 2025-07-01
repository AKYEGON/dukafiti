import { Link, useLocation } from "wouter";
import { Store, BarChart3, Package, Users, FileText, Settings, Menu, X } from "lucide-react";
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

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo and branding */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 primary-green rounded-lg flex items-center justify-center">
              <Store className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">DukaSmart</h1>
              <p className="text-gray-400 text-sm">Business Platform</p>
            </div>
          </div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-gray-800"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "primary-green text-white"
                    : "hover:bg-gray-800"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger menu button */}
      <div className="lg:hidden bg-gray-900 border-b border-gray-800 p-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-gray-800"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={20} />
        </Button>
      </div>

      {/* Desktop sidebar */}
      <aside className={cn("hidden lg:block sidebar-bg text-white w-64 min-h-screen", className)}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 sidebar-bg text-white z-50">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
