import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/SupabaseAuthClean'

export interface SearchResult {
  id: string
  type: 'product' | 'customer' | 'sale'
  title: string
  subtitle: string
  icon: string
  metadata?: any
}

export interface SearchGroup {
  category: string
  results: SearchResult[]
}

export function useSmartSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const { user } = useAuth()

  // Get all search results in a flat array for keyboard navigation
  const getAllResults = useCallback(() => {
    return searchResults.flatMap(group => group.results)
  }, [searchResults])

  // Search function with debounce
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsLoading(true)
    try {
      const searchTerm = query.toLowerCase().trim()
      const groups: SearchGroup[] = []

      // Search Products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, category, price, stock, sku')
        .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
        .limit(5)

      if (!productsError && products && products.length > 0) {
        groups.push({
          category: 'Products',
          results: products.map(product => ({
            id: product.id,
            type: 'product' as const,
            title: product.name,
            subtitle: `${product.category} • KES ${product.price} • Stock: ${product.stock ?? 'Unknown'}`,
            icon: 'package',
            metadata: { sku: product.sku }
          }))
        })
      }

      // Search Customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, email, phone, balance')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(5)

      if (!customersError && customers && customers.length > 0) {
        groups.push({
          category: 'Customers',
          results: customers.map(customer => ({
            id: customer.id,
            type: 'customer' as const,
            title: customer.name,
            subtitle: `${customer.email || customer.phone} • Balance: KES ${customer.balance}`,
            icon: 'user',
            metadata: { email: customer.email, phone: customer.phone }
          }))
        })
      }

      // Search Orders/Sales - simplified query
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total, status, payment_method, created_at')
        .or(`order_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!ordersError && orders && orders.length > 0) {
        groups.push({
          category: 'Sales',
          results: orders.map((order: any) => ({
            id: order.id,
            type: 'sale' as const,
            title: order.order_number || `Order #${order.id.slice(-8)}`,
            subtitle: `KES ${order.total} • ${order.payment_method} • ${new Date(order.created_at).toLocaleDateString()}`,
            icon: 'receipt',
            metadata: { order_number: order.order_number, total: order.total }
          }))
        })
      }

      setSearchResults(groups)
      setShowResults(groups.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setShowResults(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, performSearch])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showResults) return

    const allResults = getAllResults()
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < allResults.length) {
          e.preventDefault()
          return allResults[selectedIndex]
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }, [showResults, selectedIndex, getAllResults])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
    setSelectedIndex(-1)
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading,
    showResults,
    setShowResults,
    selectedIndex,
    handleKeyDown,
    clearSearch,
    getAllResults
  }
}