import { useState } from 'react';
import useLiveData from '../hooks/useLiveData';
import useMutation from '../hooks/useMutation';
import { Product } from '../types/schema';

export default function Inventory() {
  const { items: products, loading } = useLiveData<Product>('products');
  const addProduct = useMutation<Product>('products', 'insert');
  const updateProduct = useMutation<Product>('products', 'update');
  const deleteProduct = useMutation<Product>('products', 'delete');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    cost_price: '',
    stock_quantity: '',
    category: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price
          ? parseFloat(formData.cost_price)
          : undefined,
        stock_quantity: formData.stock_quantity
          ? parseInt(formData.stock_quantity)
          : undefined,
      };

      if (editingProduct) {
        await updateProduct.mutate({ ...productData, id: editingProduct.id });
      } else {
        await addProduct.mutate(productData);
      }

      resetForm();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct.mutate({ id });
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      price: '',
      cost_price: '',
      stock_quantity: '',
      category: '',
      description: '',
    });
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      sku: product.sku || '',
      price: product.price.toString(),
      cost_price: product.cost_price?.toString() || '',
      stock_quantity: product.stock_quantity?.toString() || '',
      category: product.category || '',
      description: product.description || '',
    });
    setEditingProduct(product);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading products...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Inventory
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Add Product
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {product.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(product)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {product.sku && <p>SKU: {product.sku}</p>}
              <p className="text-lg font-bold text-green-600">
                KES {product.price.toLocaleString()}
              </p>
              {product.stock_quantity !== undefined && (
                <p
                  className={`font-medium ${
                    product.stock_quantity <= 10
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  Stock: {product.stock_quantity}
                </p>
              )}
              {product.category && <p>Category: {product.category}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                required
              />

              <input
                type="text"
                placeholder="SKU (optional)"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />

              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                required
              />

              <input
                type="number"
                step="0.01"
                placeholder="Cost Price (optional)"
                value={formData.cost_price}
                onChange={(e) =>
                  setFormData({ ...formData, cost_price: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />

              <input
                type="number"
                placeholder="Stock Quantity (optional)"
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, stock_quantity: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />

              <input
                type="text"
                placeholder="Category (optional)"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />

              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                rows={3}
              />

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={addProduct.loading || updateProduct.loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
