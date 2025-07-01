import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, User, Database, Shield, Bell, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface BusinessProfile {
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  taxId?: string;
}

export default function Settings() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch business profile
  const { data: businessProfile, isLoading: profileLoading } = useQuery<BusinessProfile>({
    queryKey: ['/api/business-profile'],
    queryFn: async () => {
      const response = await fetch('/api/business-profile');
      if (!response.ok) {
        if (response.status === 404) return {};
        throw new Error('Failed to fetch business profile');
      }
      return response.json();
    }
  });

  // Update business profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: BusinessProfile) => {
      const response = await fetch('/api/business-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-profile'] });
      toast({
        title: "Profile Updated",
        description: "Business profile saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update business profile",
        variant: "destructive"
      });
    }
  });

  // Force sync functionality
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      // Invalidate all queries to force fresh data fetch
      await queryClient.invalidateQueries();
      await queryClient.refetchQueries();
      
      // Simulate sync time for user feedback
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Sync Complete",
        description: "All data has been synchronized successfully",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to synchronize data",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const profileData = {
      businessName: formData.get('businessName') as string,
      businessPhone: formData.get('businessPhone') as string,
      businessEmail: formData.get('businessEmail') as string,
      businessAddress: formData.get('businessAddress') as string,
      taxId: formData.get('taxId') as string,
    };
    updateProfileMutation.mutate(profileData);
  };

  if (profileLoading) {
    return (
      <div className="p-6 bg-black text-white min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-black text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <Button 
          onClick={handleForceSync} 
          disabled={isSyncing}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSyncing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Syncing...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Sync Now
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Profile */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <User className="h-5 w-5" />
              Business Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName" className="text-gray-400">Business Name</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    defaultValue={businessProfile?.businessName || ''}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter business name"
                  />
                </div>
                <div>
                  <Label htmlFor="businessPhone" className="text-gray-400">Business Phone</Label>
                  <Input
                    id="businessPhone"
                    name="businessPhone"
                    defaultValue={businessProfile?.businessPhone || ''}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="businessEmail" className="text-gray-400">Business Email</Label>
                <Input
                  id="businessEmail"
                  name="businessEmail"
                  type="email"
                  defaultValue={businessProfile?.businessEmail || ''}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="businessAddress" className="text-gray-400">Business Address</Label>
                <Input
                  id="businessAddress"
                  name="businessAddress"
                  defaultValue={businessProfile?.businessAddress || ''}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter business address"
                />
              </div>
              
              <div>
                <Label htmlFor="taxId" className="text-gray-400">Tax ID / Registration Number</Label>
                <Input
                  id="taxId"
                  name="taxId"
                  defaultValue={businessProfile?.taxId || ''}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter tax ID or registration number"
                />
              </div>
              
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <Database className="h-5 w-5" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Notifications</Label>
                <p className="text-sm text-gray-400">Receive notifications for sales and updates</p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Auto Backup</Label>
                <p className="text-sm text-gray-400">Automatically backup data daily</p>
              </div>
              <Switch
                checked={autoBackup}
                onCheckedChange={setAutoBackup}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
            
            <div className="pt-4 border-t border-gray-800">
              <h4 className="text-white font-medium mb-2">Current User</h4>
              <p className="text-gray-400 text-sm">
                Signed in as: {user?.email || user?.phone || 'Unknown User'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <Shield className="h-5 w-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <Database className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h4 className="text-white font-medium">Database Status</h4>
                <p className="text-green-500 text-sm">Connected</p>
              </div>
              
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <RefreshCw className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h4 className="text-white font-medium">Last Sync</h4>
                <p className="text-gray-400 text-sm">Just now</p>
              </div>
              
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <Bell className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h4 className="text-white font-medium">Notifications</h4>
                <p className="text-gray-400 text-sm">{notifications ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}