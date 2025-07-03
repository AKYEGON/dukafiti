import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Search, User, Plus } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  balance: number;
}

interface CustomerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

export function CustomerPickerModal({ isOpen, onClose, onSelectCustomer }: CustomerPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [searchDebounced, setSearchDebounced] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Fetch customers with search
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['/api/customers', searchDebounced],
    queryFn: () => fetch(`/api/customers?q=${encodeURIComponent(searchDebounced)}`).then(res => res.json()),
    enabled: isOpen,
  });

  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: async (customerData: { name: string; phone: string }): Promise<Customer> => {
      const response = await apiRequest('POST', '/api/customers', customerData);
      return response.json();
    },
    onSuccess: (newCustomer: Customer) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setShowAddForm(false);
      setNewCustomer({ name: '', phone: '' });
      onSelectCustomer(newCustomer);
      toast({
        title: 'Customer added',
        description: `${newCustomer.name} has been added and selected for credit sale.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add customer. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    toast({
      title: 'Customer selected',
      description: `Customer ${customer.name} selected for credit sale.`,
    });
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomer.name.trim() && newCustomer.phone.trim()) {
      addCustomerMutation.mutate(newCustomer);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showAddForm) {
        setShowAddForm(false);
      } else {
        onClose();
      }
    }
  };

  const resetModal = () => {
    setSearchQuery('');
    setShowAddForm(false);
    setNewCustomer({ name: '', phone: '' });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md"
        ref={modalRef}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-labelledby="customer-picker-title"
      >
        <DialogHeader>
          <DialogTitle id="customer-picker-title" className="text-xl font-semibold text-center">
            {showAddForm ? 'Add New Customer' : 'Select Customer for Credit Sale'}
          </DialogTitle>
        </DialogHeader>

        {!showAddForm ? (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search customers…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
                aria-label="Search customers"
              />
            </div>

            {/* Customer List */}
            <div 
              className="max-h-64 overflow-y-auto space-y-2"
              role="listbox"
              aria-label="Customer list"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primaryGreen"></div>
                </div>
              ) : customers.length > 0 ? (
                customers.map((customer: Customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="flex items-center justify-between px-4 py-3 w-full bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-primaryGreen-light dark:hover:bg-primaryGreen-dark cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-primaryGreen"
                    role="option"
                    aria-selected="false"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {customer.balance > 0 ? `KES ${customer.balance.toFixed(2)}` : 'No debt'}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No customers found' : 'No customers available'}
                </div>
              )}
            </div>

            {/* Add New Customer Button */}
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-primaryPurple text-white px-4 py-2 rounded-md w-full text-center hover:bg-primaryPurple-dark transition"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Customer
            </Button>
          </div>
        ) : (
          /* Add Customer Form */
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name *</Label>
              <Input
                id="customer-name"
                type="text"
                placeholder="Enter customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primaryGreen"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone Number *</Label>
              <Input
                id="customer-phone"
                type="tel"
                placeholder="Enter phone number"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-primaryGreen"
                required
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addCustomerMutation.isPending}
                className="flex-1 bg-primaryGreen hover:bg-primaryGreen-dark text-white"
              >
                {addCustomerMutation.isPending ? 'Saving...' : 'Save & Select'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}