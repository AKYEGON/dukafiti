import { useLocation } from 'wouter'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users
} from 'lucide-react'
interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  path: string
}
const navItems: NavItem[]  =  [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/'
  },
  {
    icon: Package,
    label: 'Inventory',
    path: '/inventory'
  },
  {
    icon: ShoppingCart,
    label: 'Sales',
    path: '/sales'
  },
  {
    icon: Users,
    label: 'Customers',
    path: '/customers'
  }
]

export function MobileBottomNav() {
  const [location, setLocation]  =  useLocation()

  const isActive = (path: string) => {
    if (path  ===  '/') {
      return location  ===  '/' || location  ===  '/dashboard'
    }
    return location  ===  path
  }

  const handleNavigation = (path: string) => {
    setLocation(path)
  }

  return (
    <nav
      className = "fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-[#1F1F1F] border-t border-gray-200 dark:border-gray-700 px-4 flex md:hidden"
      style = {{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.path)

        return (
          <button
            key = {item.path}
            onClick = {() => handleNavigation(item.path)}
            className = {`
              flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px]
              transition-all duration-200 rounded-t-lg
              focus:outline-none focus:ring-2 focus:ring-green-500
              ${active
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'hover:bg-green-50 dark:hover:bg-green-900/20'
              }
            `}
            aria-label = {item.label}
          >
            <Icon
              className = {`w-6 h-6 ${
                active
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            />
            <span
              className = {`text-xs font-medium mt-1 ${
                active
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}