import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '@/contexts/SupabaseAuthClean'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Debug() {
  const [sessionData, setSessionData]  =  useState<any>(null)
  const [userInfo, setUserInfo]  =  useState<any>(null)
  const [loading, setLoading]  =  useState(true)
  const [error, setError]  =  useState<string | null>(null)
  const { user, session, isAuthenticated }  =  useAuth()
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error }  =  await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          setError(error.message)
        } else {
          setSessionData(session)
        }
        const { data: { user }, error: userError }  =  await supabase.auth.getUser()
        if (userError) {
          console.error('Error getting user:', userError)
          setError(userError.message)
        } else {
          setUserInfo(user)
        }
      } catch (err) {
        console.error('Debug page error:', err)
        setError('Failed to check authentication')
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [])

  const testSignUp = async () => {
    const { data, error }  =  await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    })

    }

  const testSignIn = async () => {
    const { data, error }  =  await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    })

    }

  if (loading) {
    return <div className = "p-8">Loading debug information...</div>
  }
  return (
    <div className = "min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className = "max-w-4xl mx-auto space-y-6">
        <h1 className = "text-3xl font-bold text-gray-900 dark:text-white">Debug Authentication</h1>

        {error && (
          <Card className = "border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className = "text-red-800">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className = "text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Checking if environment variables are set correctly</CardDescription>
          </CardHeader>
          <CardContent className = "space-y-2">
            <div className = "grid grid-cols-2 gap-4">
              <div>
                <p className = "font-medium">VITE_SUPABASE_URL:</p>
                <p className = "text-sm text-gray-600 dark:text-gray-400 break-all">
                  {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}
                </p>
              </div>
              <div>
                <p className = "font-medium">REACT_APP_SUPABASE_URL:</p>
                <p className = "text-sm text-gray-600 dark:text-gray-400 break-all">
                  {import.meta.env.REACT_APP_SUPABASE_URL || 'NOT SET'}
                </p>
              </div>
              <div>
                <p className = "font-medium">VITE_SUPABASE_ANON_KEY:</p>
                <p className = "text-sm text-gray-600 dark:text-gray-400">
                  {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}
                </p>
              </div>
              <div>
                <p className = "font-medium">REACT_APP_SUPABASE_ANON_KEY:</p>
                <p className = "text-sm text-gray-600 dark:text-gray-400">
                  {import.meta.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auth Context State</CardTitle>
            <CardDescription>Current state from AuthContext</CardDescription>
          </CardHeader>
          <CardContent>
            <div className = "space-y-2">
              <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? user.email : 'None'}</p>
              <p><strong>Session:</strong> {session ? 'Present' : 'None'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supabase Session Data</CardTitle>
            <CardDescription>Raw session data from Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className = "bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(sessionData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supabase User Data</CardTitle>
            <CardDescription>Raw user data from Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className = "bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Authentication</CardTitle>
            <CardDescription>Test Supabase authentication functions</CardDescription>
          </CardHeader>
          <CardContent className = "space-y-4">
            <Button onClick = {testSignUp} className = "mr-4">
              Test Sign Up
            </Button>
            <Button onClick = {testSignIn}>
              Test Sign In
            </Button>
            <p className = "text-sm text-gray-600 dark:text-gray-400">
              Check the browser console for results
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}