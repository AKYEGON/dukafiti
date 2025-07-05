export default function CustomersPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          Add Customer
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg">No customers found</p>
            <p className="text-sm">Add your first customer to get started</p>
          </div>
        </div>
      </div>
    </div>
  )
}