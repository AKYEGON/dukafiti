export default function SalesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sales</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Point of Sale</h2>
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>POS interface coming soon</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Process Sale
            </button>
            <button className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Credit Sale
            </button>
            <button className="w-full p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              View Today's Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}