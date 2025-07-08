import { Product } from '../types/database';

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onRestock: () => void;
}

export default function ProductCard({ product, onEdit, onDelete, onRestock }: ProductCardProps) {
  const isLowStock = product.quantity <= product.threshold;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
          {product.sku && <p className="text-sm text-gray-500">SKU: {product.sku}</p>}
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-green-600">${product.price}</p>
          {product.cost_price && (
            <p className="text-sm text-gray-500">Cost: ${product.cost_price}</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Stock:</span>
          <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
            {product.quantity}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Threshold:</span>
          <span className="text-sm text-gray-800">{product.threshold}</span>
        </div>
      </div>

      {isLowStock && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          ⚠️ Low stock alert!
        </div>
      )}

      <div className="flex justify-between space-x-2">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onRestock}
          className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
        >
          Add Stock
        </button>
        <button
          onClick={onDelete}
          className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}