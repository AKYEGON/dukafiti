import { useState, useEffect } from 'react'
import { Search, Bell, User, LogOut, Settings, Menu, BarChart3, Package, Users, Receipt, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/SupabaseAuthClean'
import { useSmartSearch } from '@/hooks/useSmartSearch'
interface TopBarProps {
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const [, setLocation] = useLocation()
  const { user, logout } = useAuth()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading: searchLoading,
    showResults: showSearchResults,
    setShowResults: setShowSearchResults,
    selectedIndex,
    handleKeyDown,
    clearSearch,
    getAllResults
  } = useSmartSearch()
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count')
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.count || 0)
        }
      } catch (error) {
        // Notification fetch failed - not critical
      }
    }
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const allResults = getAllResults()
    if (selectedIndex >= 0 && selectedIndex < allResults.length) {
      handleSearchResultClick(allResults[selectedIndex])
    }
  }

  const handleSearchResultClick = (result: any) => {
    clearSearch()
    
    // Navigate based on result type with specific parameters
    if (result.type === 'product') {
      setLocation(`/inventory?highlight=${result.id}`)
    } else if (result.type === 'customer') {
      setLocation(`/customers/${result.id}`)
    } else if (result.type === 'sale') {
      const invoiceNumber = result.metadata?.order_number
      if (invoiceNumber) {
        setLocation(`/sales?invoice=${encodeURIComponent(invoiceNumber)}`)
      } else {
        setLocation('/reports')
      }
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    const result = handleKeyDown(e)
    if (result) {
      handleSearchResultClick(result)
    }
  }

  const getResultIcon = (iconName: string) => {
    switch (iconName) {
      case 'package': return <Package className="h-4 w-4 text-blue-500" />
      case 'user': return <Users className="h-4 w-4 text-green-500" />
      case 'receipt': return <Receipt className="h-4 w-4 text-purple-500" />
      default: return <Search className="h-4 w-4 text-gray-500" />
    }
  }
  const handleLogoutConfirm = async () => {
    try {
      await logout()
      setIsLogoutModalOpen(false)
      setLocation('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          {/* Sidebar Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Enhanced Search Bar */}
          <div className="flex-1 max-w-lg relative">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products, customers, sales..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  className="pl-10 pr-10 w-full"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </form>

            {/* Enhanced Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-80 overflow-y-auto z-50">
                {searchLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Searching...
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((group, groupIndex) => (
                      <div key={groupIndex}>
                        <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
                          {group.category}
                        </div>
                        {group.results.map((result, resultIndex) => {
                          const globalIndex = searchResults
                            .slice(0, groupIndex)
                            .reduce((sum, g) => sum + g.results.length, 0) + resultIndex
                          const isSelected = globalIndex === selectedIndex
                          
                          return (
                            <button
                              key={`${groupIndex}-${resultIndex}`}
                              onClick={() => handleSearchResultClick(result)}
                              className={`w-full px-3 py-3 text-left flex items-center gap-3 transition-colors ${
                                isSelected 
                                  ? 'bg-accent text-accent-foreground' 
                                  : 'hover:bg-accent/50 hover:text-accent-foreground'
                              }`}
                            >
                              <div className="flex-shrink-0">
                                {getResultIcon(result.icon)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{result.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                              </div>
                            </button>
                          )
                        })}
                        {groupIndex < searchResults.length - 1 && (
                          <div className="border-b border-border mx-3"></div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/notifications')}
              className="relative"
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-0"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative"
                  aria-label="User menu"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">DukaFiti User</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/reports')}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsLogoutModalOpen(true)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You'll need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsLogoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLogoutConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}