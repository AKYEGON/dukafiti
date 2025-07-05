import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Banknote, CreditCard, Smartphone } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
interface PaymentMethodSelectorProps {
  total: number
  onPaymentSelected: (method: 'cash' | 'credit' | 'mobileMoney', reference?: string) => void
  isProcessing?: boolean
}
export function PaymentMethodSelector({ total, onPaymentSelected, isProcessing = false }: PaymentMethodSelectorProps) {
  const [showCreditDialog, setShowCreditDialog]  =  useState(false)
  const [customerName, setCustomerName]  =  useState("")
  const [customerPhone, setCustomerPhone]  =  useState("")
  const [showMobileMoneyDialog, setShowMobileMoneyDialog]  =  useState(false)
  const [mobileMoneyReference, setMobileMoneyReference]  =  useState("")

  const handleCashPayment = () => {
    onPaymentSelected('cash')
  }

  const handleCreditPayment = () => {
    setShowCreditDialog(true)
  }

  const handleCreditConfirm = () => {
    if (customerName.trim() && customerPhone.trim()) {
      onPaymentSelected('credit', `${customerName.trim()},${customerPhone.trim()}`)
      setShowCreditDialog(false)
      setCustomerName("")
      setCustomerPhone("")
    }
  }

  const handleMobileMoneyPayment = () => {
    setShowMobileMoneyDialog(true)
  }

  const handleMobileMoneyConfirm = () => {
    if (mobileMoneyReference.trim()) {
      onPaymentSelected('mobileMoney', mobileMoneyReference.trim())
      setShowMobileMoneyDialog(false)
      setMobileMoneyReference("")
    }
  }

  return (
    <div className = "space-y-4">
      <div className = "text-center mb-6">
        <div className = "text-sm text-gray-600 dark:text-gray-400 mb-2">Payment Amount</div>
        <div className = "text-3xl font-bold text-green-600 dark:text-green-400">
          {formatCurrency(total)}
        </div>
      </div>

      <div className = "grid grid-cols-1 gap-4">
        {/* Cash Payment */}
        <Card className = "p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              onClick = {!isProcessing ? handleCashPayment : undefined}>
          <div className = "flex items-center gap-4">
            <div className = "p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <Banknote className = "w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className = "flex-1">
              <div className = "font-medium">Cash Payment</div>
              <div className = "text-sm text-gray-600 dark:text-gray-400">
                Immediate payment completion
              </div>
            </div>
          </div>
        </Card>

        {/* Mobile Money Payment */}
        <Card className = "p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              onClick = {!isProcessing ? handleMobileMoneyPayment : undefined}>
          <div className = "flex items-center gap-4">
            <div className = "p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Smartphone className = "w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className = "flex-1">
              <div className = "font-medium">Mobile Money</div>
              <div className = "text-sm text-gray-600 dark:text-gray-400">
                Mobile payment services
              </div>
            </div>
          </div>
        </Card>

        {/* Credit Sale */}
        <Card className = "p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              onClick = {!isProcessing ? handleCreditPayment : undefined}>
          <div className = "flex items-center gap-4">
            <div className = "p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <CreditCard className = "w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className = "flex-1">
              <div className = "font-medium">Credit Sale</div>
              <div className = "text-sm text-gray-600 dark:text-gray-400">
                Pay later option
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Credit Sale Dialog */}
      <Dialog open = {showCreditDialog} onOpenChange = {setShowCreditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit Sale Information</DialogTitle>
          </DialogHeader>
          <div className = "space-y-4">
            <div>
              <Label htmlFor = "customer-name">Customer Name</Label>
              <Input
                id = "customer-name"
                value = {customerName}
                onChange = {(e) => setCustomerName(e.target.value)}
                placeholder = "Enter customer's full name"
              />
            </div>
            <div>
              <Label htmlFor = "customer-phone">Customer Phone</Label>
              <Input
                id = "customer-phone"
                value = {customerPhone}
                onChange = {(e) => setCustomerPhone(e.target.value)}
                placeholder = "Enter customer's phone number"
              />
            </div>
            <div className = "bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm">
              <strong>Note:</strong> This sale will be recorded as a pending payment.
              The customer will need to pay later.
            </div>
            <div className = "flex gap-2 pt-4">
              <Button
                variant = "outline"
                onClick = {() => setShowCreditDialog(false)}
                disabled = {isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick = {handleCreditConfirm}
                disabled = {!customerName.trim() || !customerPhone.trim() || isProcessing}
              >
                Confirm Credit Sale
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Money Reference Dialog */}
      <Dialog open = {showMobileMoneyDialog} onOpenChange = {setShowMobileMoneyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mobile Money Payment Reference</DialogTitle>
          </DialogHeader>
          <div className = "space-y-4">
            <div>
              <Label htmlFor = "mobile-money-reference">Payment Reference</Label>
              <Input
                id = "mobile-money-reference"
                value = {mobileMoneyReference}
                onChange = {(e) => setMobileMoneyReference(e.target.value)}
                placeholder = "Enter a reference for this Mobile Money payment"
              />
            </div>
            <div className = "bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
              <strong>Note:</strong> Enter the mobile money transaction reference or any identifier for this payment.
            </div>
            <div className = "flex gap-2 pt-4">
              <Button
                variant = "outline"
                onClick = {() => setShowMobileMoneyDialog(false)}
                disabled = {isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick = {handleMobileMoneyConfirm}
                disabled = {!mobileMoneyReference.trim() || isProcessing}
              >
                Confirm Mobile Money Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}