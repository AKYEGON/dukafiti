// Runtime Data Client - No Caching, Pure Supabase Calls Only
// This replaces React Query with direct runtime data fetching

import { supabase } from './supabase';

// Global runtime data fetch function with comprehensive logging
export async function runtimeFetch(table: string, userId?: string, options: any = {}) {
  console.log(`[RuntimeData] Fetching from ${table}:`, { userId, options, timestamp: new Date().toISOString() });

  try {
    let query = supabase.from(table).select('*');
    
    // Apply store isolation if userId provided
    if (userId) {
      query = query.eq('store_id', userId);
    }
    
    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    // Apply filters
    if (options.filters) {
      for (const filter of options.filters) {
        query = query.eq(filter.column, filter.value);
      }
    }
    
    // Apply limits
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[RuntimeData] Fetch error for ${table}:`, error);
      throw error;
    }

    console.log(`[RuntimeData] Fetch success for ${table}:`, {
      recordCount: data?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    return data || [];
  } catch (error) {
    console.error(`[RuntimeData] Fetch failed for ${table}:`, error);
    throw error;
  }
}

// Global runtime insert function
export async function runtimeInsert(table: string, data: any, userId?: string) {
  console.log(`[RuntimeData] Inserting into ${table}:`, { data, userId, timestamp: new Date().toISOString() });

  try {
    const insertData = userId ? { ...data, store_id: userId } : data;
    
    const { data: result, error } = await supabase
      .from(table)
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error(`[RuntimeData] Insert error for ${table}:`, error);
      throw error;
    }

    console.log(`[RuntimeData] Insert success for ${table}:`, result);
    return result;
  } catch (error) {
    console.error(`[RuntimeData] Insert failed for ${table}:`, error);
    throw error;
  }
}

// Global runtime update function
export async function runtimeUpdate(table: string, id: string, data: any, userId?: string) {
  console.log(`[RuntimeData] Updating ${table} record ${id}:`, { data, userId, timestamp: new Date().toISOString() });

  try {
    let query = supabase.from(table).update(data).eq('id', id);
    
    if (userId) {
      query = query.eq('store_id', userId);
    }
    
    const { data: result, error } = await query.select().single();

    if (error) {
      console.error(`[RuntimeData] Update error for ${table}:`, error);
      throw error;
    }

    console.log(`[RuntimeData] Update success for ${table}:`, result);
    return result;
  } catch (error) {
    console.error(`[RuntimeData] Update failed for ${table}:`, error);
    throw error;
  }
}

// Global runtime delete function
export async function runtimeDelete(table: string, id: string, userId?: string) {
  console.log(`[RuntimeData] Deleting from ${table} record ${id}:`, { userId, timestamp: new Date().toISOString() });

  try {
    let query = supabase.from(table).delete().eq('id', id);
    
    if (userId) {
      query = query.eq('store_id', userId);
    }
    
    const { error } = await query;

    if (error) {
      console.error(`[RuntimeData] Delete error for ${table}:`, error);
      throw error;
    }

    console.log(`[RuntimeData] Delete success for ${table} record ${id}`);
    return true;
  } catch (error) {
    console.error(`[RuntimeData] Delete failed for ${table}:`, error);
    throw error;
  }
}

// Legacy compatibility - maintain the existing API for other parts of the app
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  offlineOptions?: {
    type?: 'sale' | 'inventory' | 'customer' | 'other';
    description?: string;
  }
): Promise<Response> {
  console.warn('[API] DEPRECATED: apiRequest called, transitioning to runtime functions:', url);
  
  // For now, maintain compatibility but log warnings
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} ${response.statusText}: ${errorText}`);
    }
    return response;
  } catch (error) {
    console.error(`[API] DEPRECATED Request error:`, { url, error: error.message });
    throw error;
  }
}

// Dummy QueryClient for compatibility (not actually used)
export const queryClient = {
  invalidateQueries: () => {
    console.warn('[QueryClient] invalidateQueries called - not needed with runtime data');
  },
  refetchQueries: () => {
    console.warn('[QueryClient] refetchQueries called - not needed with runtime data');
  },
  clear: () => {
    console.warn('[QueryClient] clear called - not needed with runtime data');
  }
};

// Export runtime functions for direct use
export { 
  runtimeFetch,
  runtimeInsert, 
  runtimeUpdate,
  runtimeDelete
};