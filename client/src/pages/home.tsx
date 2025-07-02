import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, BarChart3, Users, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Store,
      title: "Inventory Management",
      description: "Track products, stock levels, and manage your inventory efficiently",
      color: "bg-primaryPurple-100 text-primaryPurple dark:bg-primaryPurple-900 dark:text-primaryPurple-100"
    },
    {
      icon: BarChart3,
      title: "Sales Analytics",
      description: "Monitor your business performance with detailed sales reports",
      color: "bg-primaryGreen-100 text-primaryGreen dark:bg-primaryGreen-900 dark:text-primaryGreen-100"
    },
    {
      icon: Users,
      title: "Customer Management", 
      description: "Keep track of your customers and their purchase history",
      color: "bg-primaryPurple-100 text-primaryPurple dark:bg-primaryPurple-900 dark:text-primaryPurple-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primaryPurple-50 to-primaryGreen-50 dark:from-brandBlack dark:to-brandBlack-light">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Welcome to <span className="text-primaryGreen">DukaSmart</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            The complete business management platform that helps you streamline operations, 
            track inventory, and grow your business with powerful analytics and insights.
          </p>
          
          <div className="flex gap-4 justify-center mb-16">
            <Button 
              onClick={() => setLocation("/register")}
              className="bg-primaryGreen hover:bg-primaryGreen-dark text-white px-8 py-3 text-lg"
              size="lg"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={() => setLocation("/login")}
              variant="outline"
              className="border-primaryGreen text-primaryGreen hover:bg-primaryGreen-50 dark:hover:bg-primaryGreen-900 px-8 py-3 text-lg"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${feature.color}`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Why Choose DukaSmart?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-3 text-primaryGreen">Easy to Use</h3>
              <p className="text-muted-foreground">
                Intuitive interface designed for business owners who want to focus on growth, not complicated software.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-3 text-primaryGreen">Real-time Insights</h3>
              <p className="text-muted-foreground">
                Get instant access to your business data with live dashboards and comprehensive reports.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-3 text-primaryGreen">Secure & Reliable</h3>
              <p className="text-muted-foreground">
                Your business data is protected with enterprise-grade security and reliable cloud infrastructure.
              </p>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-semibold mb-3 text-primaryGreen">Scale with You</h3>
              <p className="text-muted-foreground">
                From small shops to growing enterprises, DukaSmart adapts to your business needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}