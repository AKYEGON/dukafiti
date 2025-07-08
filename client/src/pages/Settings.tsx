import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    store_name: '',
    owner_name: '',
    phone: '',
    address: '',
    currency: 'KES'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('store_id', user.id)
        .single();

      if (data) {
        setSettings({
          store_name: data.store_name || '',
          owner_name: data.owner_name || '',
          phone: data.phone || '',
          address: data.address || '',
          currency: data.currency || 'KES'
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          store_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setMessage('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      <div className="max-w-md">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Store Information</h2>
          
          <form onSubmit={saveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="Your Store Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Owner Name
              </label>
              <input
                type="text"
                value={settings.owner_name}
                onChange={(e) => setSettings({ ...settings, owner_name: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="Phone Number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <textarea
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="Store Address"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="KES">KES (Kenyan Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>

            {message && (
              <div className={`p-3 rounded ${
                message.includes('successfully') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}