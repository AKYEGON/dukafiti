import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

export function useWebSocket() {
  const { toast }  =  useToast()
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol  ===  "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/ws`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    ws.onopen = () => {
      // WebSocket connection established
    }
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type  ===  'dataUpdate') {
          // Handle real-time data updates
          if (data.updateType  ===  'sale') {
            // Invalidate dashboard and reports data
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] })
            queryClient.invalidateQueries({ queryKey: ["/api/metrics/dashboard"] })
            queryClient.invalidateQueries({ queryKey: ["/api/orders/recent"] })
            queryClient.invalidateQueries({ queryKey: ["/api/reports/summary"] })
            queryClient.invalidateQueries({ queryKey: ["/api/reports/trend"] })
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] })
          }
        } else if (data.type  ===  'inventoryUpdate') {
          // Handle inventory updates
          queryClient.invalidateQueries({ queryKey: ["/api/products"] })
          queryClient.invalidateQueries({ queryKey: ["/api/products/frequent"] })
        } else if (data.type  ===  'saleUpdate') {
          // Handle sale completion notifications based on status
          if (data.status  ===  'paid') {
            toast({
              title: "Sale recorded – paid",
              description: `Sale #${data.saleId} completed successfully`,
              className: "bg-green-50 border-green-200 text-green-800",
              duration: 3000
            })
          } else if (data.status  ===  'pending') {
            toast({
              title: "Sale recorded – awaiting payment",
              description: `Sale #${data.saleId} pending payment confirmation`,
              className: "bg-yellow-50 border-yellow-200 text-yellow-800",
              duration: 3000
            })
          } else if (data.status  ===  'credit') {
            toast({
              title: "Sale recorded – on credit",
              description: `Sale #${data.saleId} saved as credit sale`,
              className: "bg-blue-50 border-blue-200 text-blue-800",
              duration: 3000
            })
          }
        } else if (data.type  ===  'payment_received') {
          toast({
            title: "Payment received!",
            description: `Payment confirmed for ${data.reference} - ${formatCurrency(data.amount)}`,
            className: "bg-green-50 border-green-200 text-green-800",
            duration: 3000
          })
        } else if (data.type  ===  'payment_failed') {
          toast({
            title: "Payment failed",
            description: `Payment failed for ${data.reference}: ${data.resultDesc}`,
            variant: "destructive",
            duration: 3000
          })
        } else if (data.type  ===  'paymentRecorded') {
          // Handle credit payment recording notifications
          toast({
            title: "Payment Recorded",
            description: `Payment of ${formatCurrency(data.data.amount)} for ${data.data.customerName} recorded`,
            className: "bg-green-600 text-white border-green-500",
            duration: 4000
          })
          // Refresh customer data to show updated balances
          queryClient.invalidateQueries({ queryKey: ["/api/customers"] })
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    }
    ws.onclose = () => {
      }
    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [toast, queryClient])

  return wsRef.current
}