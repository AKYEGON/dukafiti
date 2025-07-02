import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface SearchResult {
  id: string;
  type: 'product' | 'customer' | 'order';
  title: string;
  subtitle: string;
  href: string;
}

interface UniversalSearchProps {
  className?: string;
}

export function UniversalSearch({ className }: UniversalSearchProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  const lastScrollY = useRef(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  const { data: searchResults, isLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", { q: debouncedQuery }],
    enabled: debouncedQuery.length > 2,
    retry: false,
  });

  // Handle scroll behavior
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY.current;

    // Show search bar when scrolling up by more than 20px
    if (scrollDelta < -20 && !isVisible) {
      setIsVisible(true);
    }
    // Hide search bar when scrolling down past 64px
    else if (currentScrollY > 64 && scrollDelta > 0 && isVisible) {
      setIsVisible(false);
      setIsDropdownOpen(false);
    }

    lastScrollY.current = currentScrollY;
  }, [isVisible]);

  // Throttled scroll handler
  useEffect(() => {
    let ticking = false;

    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [handleScroll]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsDropdownOpen(value.length > 0);
  };

  const handleResultClick = (result: SearchResult) => {
    setQuery("");
    setIsDropdownOpen(false);
    // Navigate to result
    window.location.href = result.href;
  };

  const clearSearch = () => {
    setQuery("");
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div
      ref={searchRef}
      className={cn(
        "sticky top-0 z-30 bg-gray-100 dark:bg-gray-800 border-b border-border transition-transform duration-200 ease-in-out",
        isVisible ? "translate-y-0" : "-translate-y-full",
        className
      )}
    >
      <div className="px-2 sm:px-4 py-2">
        <div className="relative max-w-2xl mx-auto">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search anywhere..."
              value={query}
              onChange={handleInputChange}
              onFocus={() => query.length > 0 && setIsDropdownOpen(true)}
              className="pl-12 pr-10 h-12 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <X size={16} />
              </Button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isDropdownOpen && (
            <Card className="absolute top-full left-0 right-0 mt-1 shadow-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 z-50">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Searching...
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.slice(0, 5).map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                            result.type === 'product' ? "bg-blue-500" :
                            result.type === 'customer' ? "bg-green-500" :
                            "bg-purple-500"
                          )}>
                            {result.type === 'product' ? 'P' : 
                             result.type === 'customer' ? 'C' : 'O'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {result.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {result.subtitle}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                            {result.type}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : debouncedQuery.length > 2 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No results found for "{debouncedQuery}"
                  </div>
                ) : query.length > 0 && query.length <= 2 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Type at least 3 characters to search
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}