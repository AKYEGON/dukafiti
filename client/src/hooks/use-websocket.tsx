import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export function useWebSocket() {
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'saleUpdate') {
          // Handle sale completion notifications
          if (data.paymentType === 'cash') {
            toast({
              title: "Cash sale recorded",
              description: `Sale completed for ${formatCurrency(data.total)}`,
              className: "bg-green-50 border-green-200 text-green-800",
              duration: 3000,
            });
          } else if (data.paymentType === 'credit') {
            toast({
              title: "Credit sale saved",
              description: `Credit sale recorded for ${formatCurrency(data.total)}`,
              className: "bg-blue-50 border-blue-200 text-blue-800",
              duration: 3000,
            });
          } else if (data.paymentType === 'mpesa') {
            toast({
              title: "M-Pesa payment initiated",
              description: `Payment request sent for ${data.reference}`,
              className: "bg-yellow-50 border-yellow-200 text-yellow-800",
              duration: 3000,
            });
          }
        } else if (data.type === 'payment_received') {
          toast({
            title: "M-Pesa payment received!",
            description: `Payment confirmed for ${data.reference} - ${formatCurrency(data.amount)}`,
            className: "bg-green-50 border-green-200 text-green-800",
            duration: 3000,
          });
        } else if (data.type === 'payment_failed') {
          toast({
            title: "M-Pesa payment failed",
            description: `Payment failed for ${data.reference}: ${data.resultDesc}`,
            variant: "destructive",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [toast]);

  return wsRef.current;
}