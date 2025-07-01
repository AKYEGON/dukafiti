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
        
        if (data.type === 'payment_received') {
          toast({
            title: "M-Pesa payment received!",
            description: `Payment confirmed for ${data.reference} - ${formatCurrency(data.amount)}`,
            className: "bg-green-50 border-green-200 text-green-800",
            duration: 5000,
          });
        } else if (data.type === 'payment_failed') {
          toast({
            title: "M-Pesa payment failed",
            description: `Payment failed for ${data.reference}: ${data.resultDesc}`,
            variant: "destructive",
            duration: 5000,
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