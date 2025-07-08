export default function Customers() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Customer Management</h1>
        <p className="text-gray-600">Manage customer information, track credit, and view purchase history.</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
            Add Customer
          </button>
        </div>
        <p className="text-gray-500">No customers found. Add your first customer to get started.</p>
      </div>
    </div>
  );
}