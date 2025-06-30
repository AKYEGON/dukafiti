import { Bell, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle: string;
  onMobileMenuToggle?: () => void;
}

export function Header({ title, subtitle, onMobileMenuToggle }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onMobileMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onMobileMenuToggle}
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </Button>
          
          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">John Doe</p>
              <p className="text-xs text-gray-600">Store Manager</p>
            </div>
            <div className="w-10 h-10 primary-green rounded-full flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
