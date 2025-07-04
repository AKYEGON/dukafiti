import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type Product } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

interface ProductSearchProps {
  onProductSelect: (product: Product) => void
};

export function ProductSearch({ onProductSelect }: ProductSearchProps) {;
  const [searchTerm, setSearchTerm]  =  useState("");
  const [showResults, setShowResults]  =  useState(false);
;
  const { data: products = [], isLoading }  =  useQuery<Product[]>({
    queryKey: ["/api/products"]
  });
;
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setShowResults(searchTerm.length > 0)
  }, [searchTerm]);
;
  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setSearchTerm("");
    setShowResults(false)
  };
;
  return (
    <div className = "relative w-full">
      <div className = "relative">
        <Search className = "absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type = "text"
          placeholder = "Search products by name, SKU, or category..."
          value = {searchTerm}
          onChange = {(e) => setSearchTerm(e.target.value)}
          className = "pl-10 border-2 border-gray-200 focus:border-[#00AA00] focus:ring-[#00AA00]/20"
          onFocus = {() => searchTerm.length > 0 && setShowResults(true)}
        />
      </div>

      {showResults && (
        <Card className = "absolute top-12 left-0 right-0 z-50 max-h-80 overflow-y-auto border-2 border-[#00AA00]/20 shadow-lg">
          <CardContent className = "p-0">
            {isLoading ? (
              <div className = "p-4 text-center text-gray-500">
                Searching products...
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className = "space-y-1">
                {filteredProducts.map((product) => (
                  <Button
                    key = {product.id}
                    variant = "ghost"
                    className = "w-full justify-start p-4 h-auto hover:bg-[#00AA00]/10 border-b border-gray-100 last:border-b-0"
                    onClick = {() => handleProductSelect(product)}
                  >
                    <div className = "flex items-center gap-3 w-full">
                      <div className = "flex-shrink-0 w-8 h-8 bg-[#00AA00]/10 rounded-full flex items-center justify-center">
                        <Package className = "w-4 h-4 text-[#00AA00]" />
                      </div>
                      <div className = "flex-1 text-left min-w-0">
                        <div className = "font-medium text-black truncate">
                          {product.name}
                        </div>
                        <div className = "flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <span className = "bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                            {product.sku}
                          </span>
                          <span>{product.category}</span>
                          <span className = "text-gray-400">•</span>
                          <span className = {`${
                            product.stock <= product.lowStockThreshold
                              ? 'text-red-500'
                              : 'text-gray-500'
                          }`}>
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                      <div className = "flex-shrink-0 text-right">
                        <div className = "font-semibold text-[#00AA00]">
                          {formatCurrency(product.price)}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className = "p-4 text-center text-gray-500">
                No products found matching "{searchTerm}"
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overlay to close results when clicking outside */}
      {showResults && (
        <div
          className = "fixed inset-0 z-40"
          onClick = {() => setShowResults(false)}
        />
      )}
    </div>
  )
}