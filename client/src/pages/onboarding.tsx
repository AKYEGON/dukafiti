import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Store, BarChart3, Users } from "lucide-react";
;
export default function Onboarding() {;
  const [, setLocation]  =  useLocation();
;
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
    }
  ];
;
  return (
    <div className = "min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className = "w-full max-w-2xl">
        <CardHeader className = "text-center">
          <div className = "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className = "h-8 w-8 text-green-600" />
          </div>
          <CardTitle className = "text-3xl font-bold text-green-600">
            Welcome to DukaFiti!
          </CardTitle>
          <CardDescription className = "text-lg">
            Your business management platform is ready to go
          </CardDescription>
        </CardHeader>
        <CardContent className = "space-y-6">
          <div className = "grid gap-4 md:grid-cols-3">
            {features.map((feature, index) => (
              <div key = {index} className = "text-center space-y-2">
                <div className = "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <feature.icon className = "h-6 w-6 text-green-600" />
                </div>
                <h3 className = "font-semibold">{feature.title}</h3>
                <p className = "text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className = "text-center space-y-4 pt-6">
            <p className = "text-gray-600">
              Everything is set up and ready for you to start managing your business.
            </p>
            <Button
              onClick = {() => setLocation("/")}
              className = "bg-green-600 hover:bg-green-700 px-8"
              size = "lg"
            >
              Get Started
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}