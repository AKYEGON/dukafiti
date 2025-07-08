import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuth';
import { EnhancedOfflineIndicator } from '@/components/offline/EnhancedOfflineIndicator';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { supabase } from '@/lib/supabase';
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
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { useSmartSearch, type SmartSearchResult } from '@/hooks/useSmartSearch';
import { SidebarToggleIcon } from '@/components/icons/sidebar-toggle-icon';



interface TopBarProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function TopBar({ onToggleSidebar, isSidebarCollapsed }: TopBarProps) {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  
  // Smart search functionality
  const { query, setQuery, groupedResults, hasResults, isLoading } = useSmartSearch();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  

  
  // Profile dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Logout modal state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  // Mobile search state
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  // Notifications dropdown state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Refs for outside click detection
  const searchRef = useOutsideClick<HTMLDivElement>(() => {
    setIsSearchOpen(false);
    setSelectedIndex(-1);
  }, isSearchOpen);
  

  
  const profileRef = useOutsideClick<HTMLDivElement>(() => {
    setIsProfileOpen(false);
  }, isProfileOpen);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const logoutModalRef = useRef<HTMLDivElement>(null);





  // Update search open state when query changes
  useEffect(() => {
    setIsSearchOpen(hasResults && query.trim().length > 0);
  }, [hasResults, query]);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    setIsProfileOpen(false);
    await logout();
    setLocation('/');
  };

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(-1);
  };

  const handleSearchSelect = (result: SmartSearchResult) => {
    setQuery('');
    setIsSearchOpen(false);
    setSelectedIndex(-1);
    setLocation(result.url);
  };

  // Helper function to highlight matching text
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="font-bold text-brand-600 dark:text-brand-400">
          {part}
        </span>
      ) : part
    );
  };

  // Create flat array of all results for keyboard navigation
  const allResults: SmartSearchResult[] = [
    ...groupedResults.products,
    ...groupedResults.customers,
    ...groupedResults.orders
  ];

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
    if (!isSearchOpen || allResults.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % allResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev <= 0 ? allResults.length - 1 : prev - 1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSearchSelect(allResults[selectedIndex]);
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

        {/* Center Section - Search Bar with Slogan Watermark */}
        <div className="flex-1 max-w-md mx-auto relative" ref={searchRef}>
          {/* Slogan Watermark Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            {/* Light mode slogan watermark */}
            <img 
              src="/assets/slogan-light.png" 
              alt=""
              className="opacity-5 h-6 w-auto dark:hidden"
            />
            {/* Dark mode slogan watermark */}
            <img 
              src="/assets/slogan-dark.png" 
              alt=""
              className="opacity-[0.03] h-6 w-auto hidden dark:block"
            />
          </div>
          
          <div className="relative w-full z-10">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products, customers, orders..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/90 dark:bg-[#2A2A2A]/90 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
              role="combobox"
              aria-expanded={isSearchOpen}
              aria-haspopup="listbox"
              aria-activedescendant={selectedIndex >= 0 ? `search-option-${selectedIndex}` : undefined}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
              </div>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {isSearchOpen && hasResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto animate-in slide-in-from-top-2 duration-200" role="listbox">
              {Object.entries(groupedResults).map(([type, results]: [string, SmartSearchResult[]]) => 
                results.length > 0 && (
                  <div key={type}>
                    {/* Category Header */}
                    <div className="px-4 pt-3 pb-1 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                      {typeLabels[type] || type}
                    </div>
                    
                    {/* Category Items */}
                    {results.slice(0, 5).map((result) => {
                      const IconComponent = typeIcons[type];
                      const globalIndex = allResults.findIndex(r => r.id === result.id && r.type === result.type);
                      const isSelected = globalIndex === selectedIndex;
                      
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          id={`search-option-${globalIndex}`}
                          onClick={() => handleSearchSelect(result)}
                          className={`w-full text-left px-4 py-3 flex items-center hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer transition-all duration-150 min-h-[44px] ${
                            isSelected ? 'bg-brand-500 text-white dark:bg-brand-600' : ''
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          {IconComponent && (
                            <IconComponent className={`w-5 h-5 mr-3 flex-shrink-0 ${
                              isSelected ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                            }`} />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className={`font-medium truncate ${
                              isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {highlightText(result.name, query)}
                            </div>
                            {result.subtitle && (
                              <div className={`text-sm truncate ${
                                isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              )}
              
              {/* No Results Message */}
              {!isLoading && !hasResults && query.trim().length > 0 && (
                <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{query}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 ml-4 flex-shrink-0 min-w-[100px] justify-end">

          {/* Offline Status Indicator */}
          <EnhancedOfflineIndicator />

          {/* Notifications */}
          <NotificationsDropdown 
            isOpen={isNotificationsOpen}
            setIsOpen={setIsNotificationsOpen}
          />

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