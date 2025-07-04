import { ShoppingCart, Receipt, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SaleLineItemComponent, type SaleLineItem } from "./sale-line-item"
import { formatCurrency } from "@/lib/utils"
interface MiniCartProps {
  items: SaleLineItem[]
  onQuantityChange: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onClearCart: () => void
  onCheckout: () => void
  isProcessing?: boolean
}
export function MiniCart({
  items,
  onQuantityChange,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isProcessing = false
}: MiniCartProps) {
  const totalAmount = items.reduce((sum, item) => {
    return sum + parseFloat(item.total)
  }, 0)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  if (items.length  ===  0) {
    return (
      <Card className = "border-2 border-dashed border-gray-200">
        <CardContent className = "p-8 text-center">
          <div className = "w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className = "w-8 h-8 text-gray-400" />
          </div>
          <h3 className = "font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className = "text-sm text-gray-500">
            Search and select products above to start building your sale
          </p>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className = "border-2 border-[#00AA00]/20">
      <CardHeader className = "pb-3">
        <CardTitle className = "flex items-center gap-2 text-lg">
          <ShoppingCart className = "w-5 h-5 text-[#00AA00]" />
          Sale Cart ({totalItems} {totalItems  ===  1 ? 'item' : 'items'})
        </CardTitle>
      </CardHeader>

      <CardContent className = "space-y-3">
        {/* Line Items */}
        <div className = "space-y-3 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <SaleLineItemComponent
              key = {item.id}
              item = {item}
              onQuantityChange = {onQuantityChange}
              onRemove = {onRemoveItem}
            />
          ))}
        </div>

        <Separator className = "my-4" />

        {/* Cart Summary */}
        <div className = "space-y-3">
          <div className = "flex justify-between items-center text-sm">
            <span className = "text-gray-600">Subtotal ({totalItems} items)</span>
            <span className = "font-medium">{formatCurrency(totalAmount.toFixed(2))}</span>
          </div>

          <div className = "flex justify-between items-center text-lg font-semibold">
            <span className = "text-black">Total</span>
            <span className = "text-[#00AA00]">{formatCurrency(totalAmount.toFixed(2))}</span>
          </div>
        </div>

        <Separator className = "my-4" />

        {/* Action Buttons */}
        <div className = "flex gap-2">
          <Button
            variant = "outline"
            className = "flex-1 border-[#00AA00] text-[#00AA00] hover:bg-[#00AA00]/10"
            onClick = {onClearCart}
            disabled = {isProcessing}
          >
            <Receipt className = "w-4 h-4 mr-2" />
            Save Draft
          </Button>

          <Button
            variant = "outline"
            className = "flex-1 border-red-200 text-red-600 hover:bg-red-50"
            onClick = {onClearCart}
            disabled = {isProcessing}
          >
            Clear Cart
          </Button>
        </div>

        {/* Stock Warnings */}
        {items.some(item => item.quantity > item.product.stock) && (
          <div className = "bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <div className = "flex items-start gap-2">
              <div className = "w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className = "text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h4 className = "text-sm font-medium text-red-800">Stock Alert</h4>
                <p className = "text-sm text-red-700 mt-1">
                  Some items in your cart exceed available stock. Please adjust quantities before checkout.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}