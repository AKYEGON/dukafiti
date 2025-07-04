import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthClean';
import {
  Search,
  Bell,
  User,
  Settings,
  BarChart3,
  LogOut,
  X,
  Package,
  Users,
  ShoppingCart
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { SidebarToggleIcon } from '@/components/icons/sidebar-toggle-icon';
import type { SearchResult, Notification } from '@shared/schema';

interface TopBarProps {
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
}

export function TopBar({ onToggleSidebar, isSidebarCollapsed }: TopBarProps) {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Notification state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Logout modal state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Mobile search state
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Refs for outside click detection
  const searchRef = useOutsideClick<HTMLDivElement>(() => {
    setIsSearchOpen(false);
    setSelectedIndex(-1);
  }, isSearchOpen);

  const notificationRef = useOutsideClick<HTMLDivElement>(() => {
    setIsNotificationOpen(false);
  }, isNotificationOpen);

  const profileRef = useOutsideClick<HTMLDivElement>(() => {
    setIsProfileOpen(false);
  }, isProfileOpen);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const logoutModalRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: true
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    enabled: true
  });

  const unreadCount = unreadData?.count || 0;

  // Search functionality
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      const searchUrl = `/api/search?q=${encodeURIComponent(debouncedSearchQuery)}`;
      fetch(searchUrl)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data || []);
          setIsSearchOpen(true);
        })
        .catch(err => {
          console.error('Search error:', err);
          setSearchResults([]);
        });
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [debouncedSearchQuery]);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    setIsProfileOpen(false);
    await logout();
    setLocation('/');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedIndex(-1);
  };

  const handleSearchSelect = (result: any) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setSelectedIndex(-1);

    if (result.type === 'product') {
      setLocation('/inventory');
    } else if (result.type === 'customer') {
      setLocation('/customers');
    } else if (result.type === 'order') {
      setLocation('/reports');
    }
  };

  // Helper function to highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="font-bold text-green-600 dark:text-green-400">
          {part}
        </span>
      ) : part
    );
  };

  // Group search results by type
  const groupedResults = searchResults.reduce((acc: any, result: any) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {});

  const typeLabels: { [key: string]: string } = {
    product: 'Products',
    customer: 'Customers',
    order: 'Orders'
  };

  const typeIcons: { [key: string]: any } = {
    product: Package,
    customer: Users,
    order: ShoppingCart
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev <= 0 ? searchResults.length - 1 : prev - 1)
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSearchSelect(searchResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSelectedIndex(-1);
      searchInputRef.current?.blur();
    }
  };

  // Focus trap for logout modal
  useEffect(() => {
    if (isLogoutModalOpen) {
      const focusableElements = logoutModalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0] as HTMLElement;
      firstElement?.focus();
    }
  }, [isLogoutModalOpen]);

  return (
    <>
      <div className="bg-white dark:bg-[#1F1F1F] border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center relative z-40">

        {/* Left Section - Sidebar Toggle (visible on tablet and desktop) */}
        <div className="hidden md:flex items-center mr-4">
          <button
            onClick={onToggleSidebar}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 ease-in-out ${
              isSidebarCollapsed ? 'rotate-90' : 'rotate-0'
            }`}
            aria-label="Toggle sidebar"
          >
            <SidebarToggleIcon size={20} />
          </button>
        </div>

        {/* Center Section - Search Bar (All Devices) */}
        <div className="flex-1 max-w-md mx-auto relative" ref={searchRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              role="combobox"
              aria-expanded={isSearchOpen}
              aria-haspopup="listbox"
              aria-activedescendant={selectedIndex >= 0 ? `search-option-${selectedIndex}` : undefined}
            />
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto" role="listbox">
              {Object.entries(groupedResults).map(([type, results]: [string, any]) => (
                <div key={type}>
                  {/* Category Header */}
                  <div className="px-4 pt-2 pb-1 text-xs uppercase text-gray-500 dark:text-gray-400 font-medium">
                    {typeLabels[type] || type}
                  </div>

                  {/* Category Items */}
                  {(results as any[]).slice(0, 5).map((result, index) => {
                    const IconComponent = typeIcons[type];
                    const globalIndex = searchResults.findIndex(r => r.id === result.id);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={result.id}
                        id={`search-option-${globalIndex}`}
                        onClick={() => handleSearchSelect(result)}
                        className={`w-full text-left px-4 py-2 flex items-center hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-colors ${
                          isSelected ? 'bg-green-500 text-white dark:bg-green-600' : ''
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {IconComponent && (
                          <IconComponent className={`w-4 h-4 mr-3 flex-shrink-0 ${
                            isSelected ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                          }`} />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className={`font-medium truncate ${
                            isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {highlightText(result.name || result.title, searchQuery)}
                          </div>
                          <div className={`text-sm truncate ${
                            isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {result.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {isSearchOpen && searchResults.length === 0 && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 text-gray-500 dark:text-gray-400 italic">
                No matches found
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 ml-4 flex-shrink-0 min-w-[100px] justify-end">

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                    <button
                      onClick={() => setLocation('/notifications')}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                    >
                      View all
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {notification.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : 'Just now'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Profile menu"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-md shadow-md py-2 w-48 z-50">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setLocation('/settings');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 text-gray-700 dark:text-gray-300"
                  aria-label="Go to settings"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setLocation('/reports');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 text-gray-700 dark:text-gray-300"
                  aria-label="Go to reports"
                >
                  <BarChart3 className="w-4 h-4" />
                  Reports
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 text-red-600 dark:text-red-400"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            ref={logoutModalRef}
            className="bg-white dark:bg-[#1F1F1F] rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            role="dialog"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
          >
            <h2 id="logout-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Confirm Logout
            </h2>
            <p id="logout-description" className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}