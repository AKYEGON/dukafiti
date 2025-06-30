import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pin: "",
    confirmPin: "",
  });
  const [error, setError] = useState("");

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string; pin: string }) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    },
    onSuccess: () => {
      setLocation("/onboarding");
    },
    onError: (error: any) => {
      setError(error.message || "Registration failed");
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const { name, phone, pin, confirmPin } = formData;

    if (!name || !phone || !pin || !confirmPin) {
      setError("Please fill in all fields");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    registerMutation.mutate({ name, phone, pin });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-600">Join DukaSmart</CardTitle>
          <CardDescription>
            Create your business account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={registerMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={registerMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="pin">Create PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="4-digit PIN"
                value={formData.pin}
                onChange={(e) => handleInputChange("pin", e.target.value)}
                disabled={registerMutation.isPending}
                maxLength={4}
              />
            </div>
            <div>
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                placeholder="Confirm your PIN"
                value={formData.confirmPin}
                onChange={(e) => handleInputChange("confirmPin", e.target.value)}
                disabled={registerMutation.isPending}
                maxLength={4}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}