import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Package, RefreshCw, TestTube } from 'lucide-react';

export function StockUpdateTester() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [testQuantity, setTestQuantity] = useState('5');
  const [testResults, setTestResults] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products-debug'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const testStockUpdate = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      addResult(`Starting stock update test for product ${productId}`);
      
      // Get current product data
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchError) {
        addResult(`❌ Error fetching product: ${fetchError.message}`);
        throw fetchError;
      }

      addResult(`📊 Current stock: ${currentProduct.stock}, adding: ${quantity}`);
      
      const oldStock = currentProduct.stock || 0;
      const newStock = oldStock + quantity;

      // Update the stock
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId)
        .select()
        .single();

      if (updateError) {
        addResult(`❌ Error updating stock: ${updateError.message}`);
        throw updateError;
      }

      addResult(`✅ Stock updated: ${oldStock} → ${updatedProduct.stock}`);
      
      // Verify the update by fetching again
      const { data: verifiedProduct, error: verifyError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (verifyError) {
        addResult(`⚠️ Error verifying update: ${verifyError.message}`);
      } else {
        addResult(`✅ Verification: stock is now ${verifiedProduct.stock}`);
      }

      return { oldStock, newStock: updatedProduct.stock, product: updatedProduct };
    },
    onSuccess: async (data) => {
      addResult(`🎉 Test completed successfully!`);
      
      // Invalidate queries to force UI refresh
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['products-debug'] });
      await queryClient.refetchQueries({ queryKey: ['products'] });
      
      addResult(`🔄 UI cache refreshed`);
      
      toast({
        title: 'Stock Update Test Successful',
        description: `Stock updated from ${data.oldStock} to ${data.newStock}`,
      });
    },
    onError: (error) => {
      addResult(`💥 Test failed: ${error.message}`);
      toast({
        title: 'Stock Update Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const runTest = () => {
    if (!selectedProductId || !testQuantity) {
      toast({
        title: 'Invalid Input',
        description: 'Please select a product and enter a quantity',
        variant: 'destructive',
      });
      return;
    }

    const quantity = parseInt(testQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a valid positive number',
        variant: 'destructive',
      });
      return;
    }

    addResult(`🚀 Starting stock update test...`);
    testStockUpdate.mutate({ productId: selectedProductId, quantity });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const refreshProducts = () => {
    queryClient.invalidateQueries({ queryKey: ['products-debug'] });
    addResult(`🔄 Products list refreshed`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Stock Update Tester
          </CardTitle>
          <CardDescription>Loading products...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Stock Update Tester
        </CardTitle>
        <CardDescription>
          Debug tool to test stock update functionality and cache invalidation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Select Product to Test</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshProducts}
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {products?.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  selectedProductId === product.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{product.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {product.stock ?? 'Unknown'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  SKU: {product.sku} | KES {product.price}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Test Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="test-quantity">Quantity to Add</Label>
            <Input
              id="test-quantity"
              type="number"
              min="1"
              value={testQuantity}
              onChange={(e) => setTestQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={runTest}
              disabled={testStockUpdate.isPending || !selectedProductId}
              className="w-full"
            >
              {testStockUpdate.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Run Test
                </>
              )}
            </Button>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={clearResults}
              className="w-full"
            >
              Clear Results
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <Label className="text-base font-medium">Test Results</Label>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto">
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="text-sm font-mono text-gray-700 dark:text-gray-300"
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}