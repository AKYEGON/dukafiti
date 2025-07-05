import { createContext, useContext, useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
type Theme = 'light' | 'dark'
interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isLoading: boolean
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState]  =  useState<Theme>('light')
  const queryClient = useQueryClient()
  // Fetch user theme preference
  const { data: themeData, isLoading, error }  =  useQuery<{ theme: Theme }>({
    queryKey: ['/api/settings/theme'],
    retry: false,
    throwOnError: false,
    enabled: false, // Disable automatic fetching for now
  })
  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: Theme) => {
      const response = await apiRequest("PUT", "/api/settings/theme", { theme: newTheme })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/theme'] })
    }
  })
  // Update theme and HTML class
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    updateThemeMutation.mutate(newTheme)
    applyThemeToDocument(newTheme)
  }
  // Apply theme to document
  const applyThemeToDocument = (themeToApply: Theme) => {
    const html = document.documentElement
    if (themeToApply  ===  'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }
  // Initialize theme from server data
  useEffect(() => {
    if (themeData?.theme) {
      setThemeState(themeData.theme)
      applyThemeToDocument(themeData.theme)
    }
  }, [themeData])
  // Set initial theme on mount (fallback to dark)
  useEffect(() => {
    applyThemeToDocument(theme)
  }, [])

  return (
    <ThemeContext.Provider value = {{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context  ===  undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}