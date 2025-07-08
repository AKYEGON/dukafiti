export default function Inventory() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Inventory Management</h1>
        <p className="text-gray-600">Manage your products, track stock levels, and organize inventory here.</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Products</h2>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            Add Product
          </button>
        </div>
        <p className="text-gray-500">No products found. Add your first product to get started.</p>
      </div>
    </div>
  );
}