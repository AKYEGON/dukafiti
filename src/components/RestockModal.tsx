import { useState } from 'react';
import { Product } from '../types/database';

interface RestockModalProps {
  product: Product;
  onClose: () => void;
  onSave: (values: { quantity: number; cost_price: number }) => Promise<void>;
}

export default function RestockModal({ product, onClose, onSave }: RestockModalProps) {
  const [formData, setFormData] = useState({
    quantity: '',
    cost_price: product.cost_price?.toString() || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.quantity || !formData.cost_price) {
      setError('Please fill in all fields');
      return;
    }

    const quantity = parseInt(formData.quantity);
    const cost_price = parseFloat(formData.cost_price);

    if (quantity <= 0) {
      setError('Quantity must be positive');
      return;
    }

    if (cost_price < 0) {
      setError('Cost price must be non-negative');
      return;
    }

    try {
      setLoading(true);
      await onSave({ quantity, cost_price });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restock product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const newQuantity = product.quantity + (parseInt(formData.quantity) || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Restock Product</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">{product.name}</h3>
            <div className="text-sm text-gray-600">
              <p>Current Stock: {product.quantity}</p>
              <p>Threshold: {product.threshold}</p>
              {product.cost_price && <p>Last Cost Price: ${product.cost_price}</p>}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity to Add *
              </label>
              <input
                type="number"
                name="quantity"
                required
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quantity to add"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buying Price (Cost Price) *
              </label>
              <input
                type="number"
                name="cost_price"
                required
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter cost price"
              />
            </div>

            {formData.quantity && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-700">
                  <strong>New Stock Level:</strong> {newQuantity} units
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Restocking...' : 'Restock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}