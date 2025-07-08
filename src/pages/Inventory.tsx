import { useState } from 'react';
import useLiveData from '../hooks/useLiveData';
import useMutation from '../hooks/useMutation';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types/database';
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';
import RestockModal from '../components/RestockModal';
import ProductCard from '../components/ProductCard';

export default function Inventory() {
  const { user } = useAuth();
  const { items: products, loading, error } = useLiveData<Product>('products');
  const { mutate: addProduct } = useMutation<Product>('products', 'insert');
  const { mutate: updateProduct } = useMutation<Product>('products', 'update');
  const { mutate: deleteProduct } = useMutation<Product>('products', 'delete');

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editProd, setEditProd] = useState<Product | null>(null);
  const [restockProd, setRestockProd] = useState<Product | null>(null);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading products: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          onClick={() => setShowAdd(true)}
        >
          + Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products yet.</p>
          <p className="text-gray-400 mt-2">Add your first product to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(prod => (
            <ProductCard
              key={prod.id}
              product={prod}
              onEdit={() => setEditProd(prod)}
              onDelete={() => deleteProduct({ id: prod.id })}
              onRestock={() => setRestockProd(prod)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onSave={async (values) => {
            await addProduct(values);
            setShowAdd(false);
          }}
        />
      )}
      {editProd && (
        <EditProductModal
          product={editProd}
          onClose={() => setEditProd(null)}
          onSave={async (values) => {
            await updateProduct({ id: editProd.id, ...values });
            setEditProd(null);
          }}
        />
      )}
      {restockProd && (
        <RestockModal
          product={restockProd}
          onClose={() => setRestockProd(null)}
          onSave={async ({ quantity, cost_price }) => {
            await updateProduct({ 
              id: restockProd.id, 
              quantity: restockProd.quantity + quantity, 
              cost_price 
            });
            setRestockProd(null);
          }}
        />
      )}
    </div>
  );
}