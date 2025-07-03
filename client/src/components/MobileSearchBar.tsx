import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { SearchResult } from '@shared/schema';

export function MobileSearchBar() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Search functionality
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      const searchUrl = `/api/search?q=${encodeURIComponent(debouncedSearchQuery)}`;
      fetch(searchUrl)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data.results || []);
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

  const handleSearchSelect = (result: SearchResult) => {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchOpen || searchResults.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev <= 0 ? searchResults.length - 1 : prev - 1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSearchSelect(searchResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setSelectedIndex(-1);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="sticky top-16 z-40 md:hidden">
      <div className="px-4 py-2 bg-white dark:bg-[#1F1F1F] border-b border-gray-200 dark:border-gray-700">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="search"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-12 py-3 rounded-md border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent 
                     focus:shadow-lg transition-all duration-200"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 
                       text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300
                       transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {isSearchOpen && searchResults.length > 0 && (
        <div className="bg-white dark:bg-[#1F1F1F] border-b border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
          {searchResults.slice(0, 8).map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSearchSelect(result)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 
                        transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 
                        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset
                        ${index === selectedIndex ? 'bg-green-50 dark:bg-green-900/20' : ''}
                        ${index === searchResults.length - 1 ? 'border-b-0' : ''}`}
              aria-label={`Search result: ${result.name}`}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {result.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {result.subtitle || result.type}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}