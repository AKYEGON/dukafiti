import { QueryClient, QueryFunction } from '@tanstack/react-query'
import { supabase } from './supabase'

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData = await res.json()
      const message = errorData.message || errorData.error || res.statusText
      throw new Error(message)
    } catch (parseError) {
      const text = await res.text() || res.statusText
      throw new Error(text)
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  // Get Supabase session token
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = data ? { 'Content-Type': 'application/json' } : {}

  // Add authorization header if we have a session
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  const options: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include'
  }

  const res = await fetch(url, options)
  await throwIfResNotOk(res)
  return res
}

type UnauthorizedBehavior = 'returnNull' | 'throw'

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get Supabase session token
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = {}
    
    // Add authorization header if we have a session
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: 'include'
    })

    if (unauthorizedBehavior === 'returnNull' && res.status === 401) {
      return null
    }

    await throwIfResNotOk(res)
    return res.json()
  }

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: 'returnNull' }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401, 403, or 404 errors
        if (error instanceof Error && error.message.includes('401')) return false
        if (error instanceof Error && error.message.includes('403')) return false
        if (error instanceof Error && error.message.includes('404')) return false
        return failureCount < 3
      }
    },
    mutations: {
      retry: false
    }
  }
})