export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>
        <p className="text-gray-600">Welcome to your business dashboard. Analytics and metrics will be displayed here.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800">Total Sales</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">$0.00</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800">Inventory Items</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800">Active Customers</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">0</p>
        </div>
      </div>
    </div>
  );
}