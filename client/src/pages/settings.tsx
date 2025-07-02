import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, RotateCcw, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/contexts/theme-context";

// Form validation schemas
const storeProfileSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  address: z.string().min(1, "Address is required"),
});

type StoreProfileData = z.infer<typeof storeProfileSchema>;

// Static translations
const t = {
  settings: "Settings",
  storeProfile: "Store Profile",
  storeName: "Store Name",
  ownerName: "Owner Name",
  address: "Address",
  saveProfile: "Save Profile",
  saving: "Saving...",
  darkMode: "Dark Mode",
  darkModeDesc: "Switch between light and dark themes",
  manualSync: "Manual Sync",
  syncNow: "Sync Now",
  syncing: "Syncing...",
};

interface StoreData {
  storeName?: string;
  ownerName?: string;
  address?: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  // Fetch store data
  const { data: storeData, isLoading: storeLoading } = useQuery<StoreData>({
    queryKey: ['/api/store'],
    retry: false,
  });

  // Store profile form
  const storeForm = useForm<StoreProfileData>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {
      storeName: "",
      ownerName: "",
      address: "",
    },
  });

  // Update form when store data loads
  useEffect(() => {
    if (storeData) {
      storeForm.reset({
        storeName: storeData.storeName || "",
        ownerName: storeData.ownerName || "",
        address: storeData.address || "",
      });
    }
  }, [storeData, storeForm]);

  // Store profile mutation
  const storeMutation = useMutation({
    mutationFn: async (data: StoreProfileData) => {
      const response = await apiRequest("PUT", "/api/store", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Store profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/store'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update store profile", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/sync");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Data synced successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Sync failed", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Event handlers
  const onStoreSubmit = (data: StoreProfileData) => {
    storeMutation.mutate(data);
  };

  if (storeLoading) {
    return (
      <div className="container mx-auto p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-green-500/10 rounded-lg">
          <Store className="h-6 w-6 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">{t.settings}</h1>
      </div>

      {/* Store Profile Section */}
      <Card className="bg-white dark:bg-card border-gray-200 dark:border-border">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-foreground flex items-center gap-2">
            <Store className="h-5 w-5" />
            {t.storeProfile}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...storeForm}>
            <form onSubmit={storeForm.handleSubmit(onStoreSubmit)} className="space-y-4">
              <FormField
                control={storeForm.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t.storeName}</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-input border-border text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={storeForm.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t.ownerName}</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-input border-border text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={storeForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t.address}</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="bg-input border-border text-foreground min-h-[80px]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={storeMutation.isPending}
                className="w-full bg-green-500 hover:bg-green-600 text-foreground"
              >
                {storeMutation.isPending ? t.saving : t.saveProfile}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Dark Mode Section */}
      <Card className="bg-white dark:bg-card border-gray-200 dark:border-border">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-foreground flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            {t.darkMode}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.darkModeDesc}</p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Manual Sync Section */}
      <Card className="bg-white dark:bg-card border-gray-200 dark:border-border">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-foreground flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            {t.manualSync}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="w-full bg-blue-500 hover:bg-blue-600 text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {syncMutation.isPending ? t.syncing : t.syncNow}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}