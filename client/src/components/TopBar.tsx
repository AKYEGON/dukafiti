import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Bell, User, Settings, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface SearchResult {
  id: string;
  type: 'product' | 'customer' | 'order';
  title: string;
  subtitle: string;
  href: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

interface User {
  email?: string;
  username?: string;
  phone?: string;
}

export function TopBar() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Notification state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  // Profile state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
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

  // Fetch user data
  const { data: user } = useQuery<{ user: User }>({
    queryKey: ['/api/me'],
  });

  // Search query
  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.length >= 2) {
      fetch(`/api/search?q=${encodeURIComponent(debouncedSearchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data || []);
          setIsSearchOpen(true);
          setSelectedIndex(-1);
        })
        .catch(console.error);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [debouncedSearchQuery]);

  // Notification queries
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications?limit=5'],
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => 
      fetch(`/api/notifications/${id}/read`, { method: 'POST' })
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => 
      fetch('/api/logout', { method: 'POST' })
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.clear();
      setLocation('/login');
    },
  });

  // Keyboard navigation for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSearchOpen || searchResults.length === 0) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const selected = searchResults[selectedIndex];
        setLocation(selected.href);
        setIsSearchOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, searchResults, selectedIndex, setLocation]);

  const handleSearchResultClick = (result: SearchResult) => {
    setLocation(result.href);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSelectedIndex(-1);
  };

  const handleMarkAsRead = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  const getUserInitials = () => {
    const name = user?.user?.username || user?.user?.email || user?.user?.phone || 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 md:hidden">
          <div className="bg-white dark:bg-black p-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products, customers, orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  autoFocus
                />
              </div>
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="px-4 py-3 text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
            </div>
            
            {/* Mobile Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                {searchResults.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      handleSearchResultClick(result);
                      setIsMobileSearchOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${
                      index === selectedIndex ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{result.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{result.subtitle}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-16">
          {/* Desktop Search Bar */}
          <div className="hidden md:block flex-1 max-w-lg mx-auto">
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products, customers, orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>
              
              {/* Search Results Dropdown */}
              {isSearchOpen && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="py-2">
                    {['product', 'customer', 'order'].map(type => {
                      const items = searchResults.filter(r => r.type === type);
                      if (items.length === 0) return null;
                      
                      return (
                        <div key={type}>
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {type === 'product' ? 'Products' : type === 'customer' ? 'Customers' : 'Orders'}
                          </div>
                          {items.map((result, index) => {
                            const globalIndex = searchResults.indexOf(result);
                            return (
                              <button
                                key={result.id}
                                onClick={() => handleSearchResultClick(result)}
                                className={`w-full px-3 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 ${
                                  globalIndex === selectedIndex ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                                }`}
                              >
                                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{result.title}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{result.subtitle}</div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount.count > 9 ? '9+' : unreadCount.count}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {(!notifications || notifications.length === 0) ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No new notifications
                      </div>
                    ) : (
                      (notifications as Notification[]).map((notification: Notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  {notification.title}
                                </h4>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <button
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 ml-2"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Link href="/notifications" className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300">
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                aria-label="User menu"
              >
                <div className="h-8 w-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {getUserInitials()}
                </div>
                <ChevronDown className="h-4 w-4 hidden sm:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Link
                      href="/support"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <HelpCircle className="h-4 w-4" />
                      Help & Support
                    </Link>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logoutMutation.mutate();
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}