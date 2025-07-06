import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DebugAuth() {
  const [status, setStatus] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        
        // Test basic Supabase connection
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase auth error:', error);
          setError(`Auth error: ${error.message}`);
          setStatus('Failed');
          return;
        }
        
        console.log('Supabase auth session:', data);
        setStatus('Success - Supabase connected');
        
        // Test database connection
        const { data: testData, error: dbError } = await supabase
          .from('products')
          .select('count')
          .limit(1);
          
        if (dbError) {
          console.error('Database test error:', dbError);
          setError(`Database error: ${dbError.message}`);
        } else {
          console.log('Database test successful');
        }
        
      } catch (err) {
        console.error('Connection test failed:', err);
        setError(`Connection failed: ${(err as Error).message}`);
        setStatus('Failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Debug Auth</h1>
        
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Connection Status</h2>
          <p className="text-sm">{status}</p>
          
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <h2 className="font-semibold mb-2">Environment Check</h2>
          <p className="text-sm">
            Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing'}
          </p>
          <p className="text-sm">
            Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}
          </p>
        </div>
      </div>
    </div>
  );
}