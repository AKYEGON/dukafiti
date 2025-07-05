export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">KES 0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Orders Today</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Inventory Items</h3>
          <p className="text-3xl font-bold text-purple-600">0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Low Stock Items</h3>
          <p className="text-3xl font-bold text-orange-600">0</p>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Add Product
          </button>
          <button className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Make Sale
          </button>
          <button className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add Customer
          </button>
          <button className="p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            View Reports
          </button>
        </div>
      </div>
    </div>
  )
}