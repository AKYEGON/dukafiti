import { useState } from 'react';
import useLiveData from '../hooks/useLiveData';
import useMutation from '../hooks/useMutation';
import { Customer } from '../types/schema';

export default function Customers() {
  const { items: customers, loading } = useLiveData<Customer>('customers');
  const addCustomer = useMutation<Customer>('customers', 'insert');
  const updateCustomer = useMutation<Customer>('customers', 'update');
  const deleteCustomer = useMutation<Customer>('customers', 'delete');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    balance: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customerData = {
        ...formData,
        balance: parseFloat(formData.balance) || 0,
      };

      if (editingCustomer) {
        await updateCustomer.mutate({
          ...customerData,
          id: editingCustomer.id,
        });
      } else {
        await addCustomer.mutate(customerData);
      }

      resetForm();
    } catch (error) {
      console.error('Failed to save customer:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer.mutate({ id });
      } catch (error) {
        console.error('Failed to delete customer:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      balance: '',
    });
    setShowAddModal(false);
    setEditingCustomer(null);
  };

  const openEditModal = (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      balance: customer.balance.toString(),
    });
    setEditingCustomer(customer);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading customers...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Customers
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Add Customer
        </button>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {customer.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(customer)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {customer.phone && <p>Phone: {customer.phone}</p>}
              {customer.email && <p>Email: {customer.email}</p>}
              {customer.address && <p>Address: {customer.address}</p>}
              <p
                className={`text-lg font-bold ${
                  customer.balance > 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                Balance: KES {customer.balance.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingCustomer) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingCustomer ? 'Edit Customer' : 'Add Customer'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Customer Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                required
              />

              <input
                type="tel"
                placeholder="Phone Number (optional)"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />

              <input
                type="email"
                placeholder="Email (optional)"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />

              <textarea
                placeholder="Address (optional)"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                rows={2}
              />

              <input
                type="number"
                step="0.01"
                placeholder="Credit Balance (optional)"
                value={formData.balance}
                onChange={(e) =>
                  setFormData({ ...formData, balance: e.target.value })
                }
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={addCustomer.loading || updateCustomer.loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
                >
                  {editingCustomer ? 'Update' : 'Add'} Customer
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
