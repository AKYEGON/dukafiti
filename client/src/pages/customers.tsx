import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, User, Phone, Search, Filter, CreditCard, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { CustomerForm } from "@/components/customers/customer-form";
import { RecordRepaymentModal } from "@/components/customers/record-repayment-modal";
import { MobilePageWrapper } from "@/components/layout/mobile-page-wrapper";
import { motion, AnimatePresence } from "framer-motion";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showEditCustomerForm, setShowEditCustomerForm] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "withDebt" | "noDebt">("all");

  // Filter and search customers
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    let filtered = customers.filter(customer => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchQuery));
      
      const balance = parseFloat(customer.balance || "0");
      const matchesFilter = 
        filterType === "all" ||
        (filterType === "withDebt" && balance > 0) ||
        (filterType === "noDebt" && balance <= 0);
      
      return matchesSearch && matchesFilter;
    });
    
    // Sort by debt status (with debt first), then by name
    return filtered.sort((a, b) => {
      const aBalance = parseFloat(a.balance || "0");
      const bBalance = parseFloat(b.balance || "0");
      
      if (aBalance > 0 && bBalance <= 0) return -1;
      if (aBalance <= 0 && bBalance > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [customers, searchQuery, filterType]);

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditCustomerForm(true);
  };

  const handleRecordRepayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowRepaymentModal(true);
  };

  const handleCloseRepaymentModal = () => {
    setShowRepaymentModal(false);
    setSelectedCustomer(null);
  };

  if (isLoading) {
    return (
      <MobilePageWrapper title="Customers">
        <div className="space-y-6">
          {/* Loading Header */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-48"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          
          {/* Loading Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MobilePageWrapper>
    );
  }

  return (
    <MobilePageWrapper title="Customers">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => setShowNewCustomerForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white min-h-[48px] px-6"
              aria-label="Add new customer"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Customer
            </Button>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-[48px] border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
                aria-label="Search customers"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={filterType} onValueChange={(value: "all" | "withDebt" | "noDebt") => setFilterType(value)}>
                <SelectTrigger className="w-40 min-h-[48px] border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="withDebt">With Debt</SelectItem>
                  <SelectItem value="noDebt">No Debt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredCustomers.length === 0 && !isLoading ? (
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {customers?.length === 0 ? "No customers yet" : "No customers found"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {customers?.length === 0 
                  ? "Start building your customer base by adding your first customer."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {customers?.length === 0 && (
                <Button 
                  onClick={() => setShowNewCustomerForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white min-h-[48px]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Customer
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Customer Cards Grid */
          <AnimatePresence>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map((customer, index) => {
                const balance = parseFloat(customer.balance || "0");
                const hasDebt = balance > 0;
                
                return (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card 
                      className={`
                        bg-white dark:bg-gray-800 
                        border-2 transition-all duration-300 cursor-pointer
                        hover:shadow-xl hover:-translate-y-1 hover:shadow-purple-500/20
                        ${hasDebt 
                          ? "border-green-500 shadow-lg shadow-green-500/10" 
                          : "border-gray-200 dark:border-gray-700"
                        }
                      `}
                    >
                      <CardContent className="p-6">
                        {/* Customer Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`
                              w-12 h-12 rounded-full flex items-center justify-center
                              ${hasDebt 
                                ? "bg-green-100 dark:bg-green-900/30" 
                                : "bg-gray-100 dark:bg-gray-700"
                              }
                            `}>
                              <User className={`h-6 w-6 ${hasDebt ? "text-green-600" : "text-gray-400"}`} />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                {customer.name}
                              </h3>
                              {hasDebt && (
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 text-red-500" />
                                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                    Outstanding Debt
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Customer Details */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">{customer.phone || "No phone"}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <CreditCard className={`h-4 w-4 ${hasDebt ? "text-red-500" : "text-green-500"}`} />
                            <span className={`font-semibold ${hasDebt ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                              {hasDebt ? formatCurrency(balance) : "No debt"}
                            </span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleEditCustomer(customer)}
                            variant="outline" 
                            size="sm"
                            className="flex-1 min-h-[40px] border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            aria-label={`Edit ${customer.name} details`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          
                          {hasDebt && (
                            <Button 
                              onClick={() => handleRecordRepayment(customer)}
                              size="sm"
                              className="flex-1 min-h-[40px] bg-green-600 hover:bg-green-700 text-white"
                              aria-label={`Record repayment for ${customer.name}`}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Record Repayment
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Customer Form Modal */}
        <CustomerForm
          open={showNewCustomerForm}
          onOpenChange={setShowNewCustomerForm}
        />

        {/* Edit Customer Form Modal */}
        <CustomerForm
          open={showEditCustomerForm}
          onOpenChange={setShowEditCustomerForm}
          customer={selectedCustomer || undefined}
        />

        {/* Record Repayment Modal */}
        {selectedCustomer && (
          <RecordRepaymentModal
            isOpen={showRepaymentModal}
            onClose={handleCloseRepaymentModal}
            customer={selectedCustomer}
          />
        )}
      </div>
    </MobilePageWrapper>
  );
}