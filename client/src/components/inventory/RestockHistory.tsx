import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Calendar, User, FileText, ArrowLeft } from 'lucide-react';
import { getRestockHistory, RestockItem } from '@/lib/profit-data';

interface RestockHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

type RestockPeriod = 'today' | 'week' | 'month' | undefined;

export function RestockHistory({ isOpen, onClose }: RestockHistoryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<RestockPeriod>('week');

  // Fetch restock history
  const { data: restockHistory, isLoading, error } = useQuery({
    queryKey: ['restock-history', selectedPeriod],
    queryFn: () => getRestockHistory(selectedPeriod),
    enabled: isOpen,
    staleTime: 30000,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Restock History
          </DialogTitle>
          <DialogDescription>
            View all inventory restocking activities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={(value: RestockPeriod) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value={undefined}>All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 dark:text-red-400 mb-2">
                  Error loading restock history
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : !restockHistory || restockHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No restocks found</p>
                <p className="text-sm">
                  {selectedPeriod === 'today' ? "No restocks were made today." :
                   selectedPeriod === 'week' ? "No restocks were made this week." :
                   selectedPeriod === 'month' ? "No restocks were made this month." :
                   "No restock history available."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {restockHistory.map((restock: RestockItem) => (
                  <div 
                    key={restock.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {restock.productName}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            +{restock.quantity}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(restock.createdAt)}
                          </span>
                          
                          {restock.supplier && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {restock.supplier}
                            </span>
                          )}
                          
                          {restock.note && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Note
                            </span>
                          )}
                        </div>
                        
                        {restock.note && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            {restock.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {restockHistory && restockHistory.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Total restocks: {restockHistory.length}
                </span>
                <span className="text-muted-foreground">
                  Total units added: {restockHistory.reduce((sum, r) => sum + r.quantity, 0)}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}