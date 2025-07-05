export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Store Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Store Name</label>
              <input
                type="text"
                placeholder="Your Store Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Owner Name</label>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Save Changes
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Dark Mode</span>
              <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                <span className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>Email Notifications</span>
              <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                <span className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}