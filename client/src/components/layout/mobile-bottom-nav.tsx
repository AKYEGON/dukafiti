import { useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users 
} from 'lucide-react';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  activeColor: string;
}

const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Home',
    path: '/',
    activeColor: '#00AA00'
  },
  {
    icon: Package,
    label: 'Stock',
    path: '/inventory',
    activeColor: '#00AA00'
  },
  {
    icon: ShoppingCart,
    label: 'Sell',
    path: '/sales',
    activeColor: '#00AA00'
  },
  {
    icon: Users,
    label: 'Clients',
    path: '/customers',
    activeColor: '#00AA00'
  }
];

export function MobileBottomNav() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location === '/' || location === '/dashboard';
    }
    return location === path;
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-700 h-16 flex sm:hidden z-[60]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className="flex-1 flex flex-col items-center justify-center h-full px-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
            aria-label={`Navigate to ${item.label}`}
          >
            <Icon 
              className={`h-5 w-5 mb-1 ${active ? 'text-green-500' : 'text-white'}`}
            />
            <span 
              className={`text-xs font-medium ${active ? 'text-green-500' : 'text-white'}`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}