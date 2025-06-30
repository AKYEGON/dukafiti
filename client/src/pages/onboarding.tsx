import { useLocation } from "wouter";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CheckCircle, Store, BarChart3, Users, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const onboardingSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  paybill: z.string().min(1, "Paybill/Till Number is required"),
  consumerKey: z.string().min(1, "Consumer Key is required"),
  consumerSecret: z.string().min(1, "Consumer Secret is required"),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"welcome" | "setup">("welcome");
  const { toast } = useToast();

  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      businessName: "",
      paybill: "",
      consumerKey: "",
      consumerSecret: "",
    },
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingForm) => {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to complete setup");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Setup Complete",
        description: "Your business profile has been configured successfully.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OnboardingForm) => {
    onboardingMutation.mutate(data);
  };

  const features = [
    {
      icon: Store,
      title: "Inventory Management",
      description: "Track products, stock levels, and manage your inventory efficiently"
    },
    {
      icon: BarChart3,
      title: "Sales Analytics",
      description: "Monitor your business performance with detailed sales reports"
    },
    {
      icon: Users,
      title: "Customer Management", 
      description: "Keep track of your customers and their purchase history"
    },
    {
      icon: CreditCard,
      title: "M-Pesa Integration",
      description: "Accept payments seamlessly through M-Pesa integration"
    }
  ];

  if (step === "welcome") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-600">
              Welcome to DukaSmart!
            </CardTitle>
            <CardDescription className="text-lg">
              Your business management platform is ready to go
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {features.map((feature, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <feature.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center space-y-4 pt-6">
              <p className="text-gray-600">
                Let's set up your business profile and payment integration.
              </p>
              <Button 
                onClick={() => setStep("setup")}
                className="bg-green-600 hover:bg-green-700 px-8"
                size="lg"
              >
                Continue Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Business Setup</CardTitle>
          <CardDescription>
            Configure your business profile and M-Pesa integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your business name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paybill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paybill/Till Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your Paybill or Till number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="consumerKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumer Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your M-Pesa Consumer Key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="consumerSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consumer Secret</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your M-Pesa Consumer Secret" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("welcome")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={onboardingMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {onboardingMutation.isPending ? "Setting up..." : "Complete Setup"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}