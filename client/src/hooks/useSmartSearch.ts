import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useDebounce } from './useDebounce';

export interface SmartSearchResult {
  id: number;
  type: 'product' | 'customer' | 'order';
  name: string;
  subtitle?: string;
  url: string;
}

export interface GroupedSearchResults {
  products: SmartSearchResult[];
  customers: SmartSearchResult[];
  orders: SmartSearchResult[];
}

export function useSmartSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SmartSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  const searchProducts = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) return [];
    
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, sku, price')
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      .limit(5);
    
    if (error) {
      
      return [];
    }
    
    return (products || []).map(product => ({
      id: product.id,
      type: 'product' as const,
      name: product.name,
      subtitle: `${product.sku} • KES ${product.price}`,
      url: `/inventory?highlight=${product.id}`
    }));
  }, []);

  const searchCustomers = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) return [];
    
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .limit(5);
    
    if (error) {
      
      return [];
    }
    
    return (customers || []).map(customer => ({
      id: customer.id,
      type: 'customer' as const,
      name: customer.name,
      subtitle: customer.phone || customer.email,
      url: `/customers?highlight=${customer.id}`
    }));
  }, []);

  const searchOrders = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) return [];
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, customer_name, total, status, reference')
      .or(`customer_name.ilike.%${searchTerm}%,reference.ilike.%${searchTerm}%`)
      .limit(5);
    
    if (error) {
      
      return [];
    }
    
    return (orders || []).map(order => ({
      id: order.id,
      type: 'order' as const,
      name: `Order #${order.id.toString().padStart(3, '0')}`,
      subtitle: `${order.customer_name} • KES ${order.total}`,
      url: `/reports?order=${order.id}`
    }));
  }, []);

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [products, customers, orders] = await Promise.all([
        searchProducts(searchTerm),
        searchCustomers(searchTerm),
        searchOrders(searchTerm)
      ]);

      const allResults = [...products, ...customers, ...orders];
      setResults(allResults);
    } catch (err) {
      
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchProducts, searchCustomers, searchOrders]);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const groupedResults: GroupedSearchResults = {
    products: results.filter(r => r.type === 'product'),
    customers: results.filter(r => r.type === 'customer'),
    orders: results.filter(r => r.type === 'order')
  };

  return {
    query,
    setQuery,
    results,
    groupedResults,
    isLoading,
    error,
    hasResults: results.length > 0
  };
}