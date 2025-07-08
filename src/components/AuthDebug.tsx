import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function AuthDebug() {
  const { user, loading } = useAuth();

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('Session data:', data);
      console.log('Session error:', error);
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold">Auth Debug Info</h3>
      <p>Loading: {loading ? 'true' : 'false'}</p>
      <p>User: {user ? user.email : 'null'}</p>
      <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'fallback'}</p>
      <button 
        onClick={testConnection}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Connection
      </button>
    </div>
  );
}