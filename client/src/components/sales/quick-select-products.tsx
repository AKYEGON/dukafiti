import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface FrequentProduct {
  id: number
  name: string
  price: string
}

interface QuickSelectProductsProps {
  onProductSelect: (productId: number)  = > void
};

export function QuickSelectProducts({ onProductSelect }: QuickSelectProductsProps) {;
  const { data: frequentProducts  =  [], isLoading }  =  useQuery<FrequentProduct[]>({
    queryKey: ["/api/products/frequent"]
  });
;
  if (isLoading) {;
    return (
      <Card className = "bg-card border">
        <CardHeader className = "pb-3">
          <CardTitle className = "flex items-center space-x-2 text-foreground">
            <Zap className = "h-5 w-5 text-green-500" />
            <span>Quick Select</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className = "grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i)  = > (
              <div key = {i} className = "h-12 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (frequentProducts.length  ===  0) {;
    return (
      <Card className = "bg-card border">
        <CardHeader className = "pb-3">
          <CardTitle className = "flex items-center space-x-2 text-foreground">
            <Zap className = "h-5 w-5 text-green-500" />
            <span>Quick Select</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className = "text-center py-6 text-muted-foreground">
            <Zap className = "h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className = "text-sm">No frequently sold products yet</p>
            <p className = "text-xs mt-1">Complete a few sales to see quick access options</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className = "bg-card border">
      <CardHeader className = "pb-3">
        <CardTitle className = "flex items-center space-x-2 text-foreground">
          <Zap className = "h-5 w-5 text-green-500" />
          <span>Quick Select</span>
        </CardTitle>
        <p className = "text-sm text-muted-foreground">Most frequently sold products</p>
      </CardHeader>
      <CardContent>
        <div className = "grid grid-cols-2 gap-2">
          {frequentProducts.slice(0, 6).map((product)  = > (
            <Button
              key = {product.id}
              variant = "outline"
              className = "h-auto p-3 flex flex-col items-start space-y-1 border-2 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
              onClick = {()  = > onProductSelect(product.id)}
            >
              <div className = "flex items-center justify-between w-full">
                <span className = "text-xs font-medium text-foreground truncate">
                  {product.name}
                </span>
                <Plus className = "h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0 ml-1" />
              </div>
              <span className = "text-sm font-bold text-green-600 dark:text-green-400">
                {formatPrice(product.price)}
              </span>
            </Button>
          ))}
        </div>
        {frequentProducts.length > 6 && (
          <div className = "mt-3 text-center">
            <Button variant = "ghost" size = "sm" className = "text-muted-foreground text-xs">
              +{frequentProducts.length - 6} more products
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}