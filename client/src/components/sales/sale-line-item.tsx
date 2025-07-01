import { useState } from "react";
import { Trash2, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuantityStepper } from "./quantity-stepper";
import { type Product } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export interface SaleLineItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: string;
  total: string;
}

interface SaleLineItemProps {
  item: SaleLineItem;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function SaleLineItemComponent({ item, onQuantityChange, onRemove }: SaleLineItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(item.id);
    }, 150);
  };

  const isLowStock = item.product.stock <= item.product.lowStockThreshold;
  const isOutOfStock = item.quantity > item.product.stock;

  return (
    <Card className={`transition-all duration-150 ${isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${isOutOfStock ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Product Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 bg-[#00AA00]/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-[#00AA00]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-black truncate">{item.product.name}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                  {item.product.sku}
                </span>
                <span className="text-gray-400">•</span>
                <span className="font-medium text-[#00AA00]">
                  {formatCurrency(item.unitPrice)}
                </span>
              </div>
              {(isLowStock || isOutOfStock) && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-600">
                    {isOutOfStock 
                      ? `Only ${item.product.stock} in stock` 
                      : `Low stock: ${item.product.stock} remaining`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Qty:</span>
              <QuantityStepper
                value={item.quantity}
                onChange={(quantity) => onQuantityChange(item.id, quantity)}
                min={1}
                max={item.product.stock}
              />
            </div>

            {/* Line Total */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-semibold text-lg text-black">
                  {formatCurrency(item.total)}
                </div>
                {item.quantity > 1 && (
                  <div className="text-xs text-gray-500">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}