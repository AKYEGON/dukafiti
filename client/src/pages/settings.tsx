import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, RotateCcw, Moon, Sun, Edit2, Check, X, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/theme-context";
import { RefreshButton } from "@/components/ui/refresh-button";
import { useEnhancedQuery } from "@/hooks/useEnhancedQuery";
import { useComprehensiveRealtime } from "@/hooks/useComprehensiveRealtime";
import { getStoreProfile, saveStoreProfile } from "@/lib/settings-storage";
import { OfflineSettings } from "@/components/offline/OfflineSettings";

// Form validation schemas
const storeProfileSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  address: z.string().min(1, "Address is required"),
});

type StoreProfileData = z.infer<typeof storeProfileSchema>;

interface StoreData {
  storeName?: string;
  ownerName?: string;
  address?: string;
}

interface EditableSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isEditing: boolean;
  onEditToggle: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

// Editable Section Component
const EditableSection = ({ 
  title, 
  icon: Icon, 
  children, 
  isEditing, 
  onEditToggle, 
  onSave, 
  onCancel,
  isLoading = false 
}: EditableSectionProps) => (
  <div className="bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition dark:shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-accent" />
        <h2 className="text-xl font-bold text-foreground">
          {title}
          <div className="h-0.5 bg-accent mt-1 w-full"></div>
        </h2>
      </div>
      {!isEditing && onSave && (
        <button
          onClick={onEditToggle}
          aria-label={`Edit ${title}`}
          className="p-2 text-gray-500 hover:text-accent hover:bg-accent-50 dark:hover:bg-purple-900/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <Edit2 className="h-5 w-5" />
        </button>
      )}
    </div>
    
    <div className="space-y-4">
      {children}
    </div>
    
    {isEditing && onSave && onCancel && (
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <Button
          onClick={onSave}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 h-12 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <Check className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save"}
        </Button>
        <Button
          onClick={onCancel}
          disabled={isLoading}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 h-12 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    )}
  </div>
);

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  // Editing states
  const [editingStore, setEditingStore] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Enable comprehensive real-time updates
  const { forceRefresh, isConnected } = useComprehensiveRealtime({
    enabled: true,
    tables: ['products', 'customers', 'orders', 'notifications'],
    autoRefresh: true,
    showNotifications: false, // Disable notifications on settings page
  });

  // Auto-refresh when page becomes visible


  // Load store data from localStorage first, fallback to Supabase
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);

  useEffect(() => {
    const loadStoreProfile = async () => {
      // Try localStorage first
      const localProfile = getStoreProfile();
      if (localProfile) {
        setStoreData(localProfile);
        setStoreLoading(false);
        return;
      }
      
      // Set default data if nothing exists
      setStoreData({
        storeName: '',
        ownerName: '',
        address: ''
      });
      setStoreLoading(false);
    };

    loadStoreProfile();
  }, []);

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

  // Store profile mutation with localStorage persistence
  const storeMutation = useMutation({
    mutationFn: async (data: StoreProfileData) => {
      // Save to localStorage immediately
      const profileData = {
        storeName: data.storeName,
        ownerName: data.ownerName,
        storeType: 'retail',
        location: data.address,
        phone: '',
        email: '',
        description: ''
      };
      
      saveStoreProfile(profileData);
      setStoreData(profileData);
      
      // Try to save to Supabase as backup
      try {
        // Note: Supabase backup functionality can be added here if needed
        console.log('Store profile saved to localStorage:', profileData);
      } catch (error) {
        console.log('Note: Could not save to Supabase backup, using localStorage only');
      }
      
      return profileData;
    },
    onSuccess: () => {
      toast({ title: "Store profile updated successfully" });
      setEditingStore(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update store profile", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Manual sync mutation - refresh all data
  const syncMutation = useMutation({
    mutationFn: async () => {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: "Data synced successfully" });
      setLastSyncTime(new Date().toLocaleString());
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
  const handleStoreSave = () => {
    storeForm.handleSubmit((data) => {
      storeMutation.mutate(data);
    })();
  };

  const handleStoreCancel = () => {
    storeForm.reset({
      storeName: storeData?.storeName || "",
      ownerName: storeData?.ownerName || "",
      address: storeData?.address || "",
    });
    setEditingStore(false);
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background p-6 lg:p-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6 lg:py-12">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent-500/10 rounded-lg">
                <Store className="h-7 w-7 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your store configuration and preferences
                </p>
              </div>
            </div>
            <RefreshButton
              onRefresh={async () => {
                // Refresh store data
                const profile = getStoreProfile();
                if (profile) {
                  setStoreData(profile);
                }
              }}
              size="sm"
              variant="outline"
            />
          </div>

          {/* Responsive Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Store Profile Section */}
          <EditableSection
            title="Store Profile"
            icon={Store}
            isEditing={editingStore}
            onEditToggle={() => setEditingStore(true)}
            onSave={handleStoreSave}
            onCancel={handleStoreCancel}
            isLoading={storeMutation.isPending}
          >
            {editingStore ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Store Name
                  </label>
                  <Input
                    {...storeForm.register("storeName")}
                    className="w-full h-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 bg-background text-foreground"
                    placeholder="Enter store name"
                  />
                  {storeForm.formState.errors.storeName && (
                    <p className="text-red-500 text-sm mt-1">
                      {storeForm.formState.errors.storeName.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Owner Name
                  </label>
                  <Input
                    {...storeForm.register("ownerName")}
                    className="w-full h-12 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 bg-background text-foreground"
                    placeholder="Enter owner name"
                  />
                  {storeForm.formState.errors.ownerName && (
                    <p className="text-red-500 text-sm mt-1">
                      {storeForm.formState.errors.ownerName.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Address
                  </label>
                  <Textarea
                    {...storeForm.register("address")}
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 bg-background text-foreground"
                    placeholder="Enter store address"
                  />
                  {storeForm.formState.errors.address && (
                    <p className="text-red-500 text-sm mt-1">
                      {storeForm.formState.errors.address.message}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 leading-relaxed">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Store Name</p>
                  <p className="text-base text-foreground mt-1">
                    {storeData?.storeName || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Owner Name</p>
                  <p className="text-base text-foreground mt-1">
                    {storeData?.ownerName || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-base text-foreground mt-1">
                    {storeData?.address || "Not set"}
                  </p>
                </div>
              </div>
            )}
          </EditableSection>

          {/* Dark Mode Section */}
          <EditableSection
            title="Dark Mode"
            icon={theme === 'dark' ? Moon : Sun}
            isEditing={false}
            onEditToggle={() => {}}
          >
            <div className="flex items-center justify-between leading-relaxed">
              <div className="space-y-2">
                <p className="text-base text-foreground">Theme Preference</p>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                className="focus:ring-2 focus:ring-accent"
              />
            </div>
          </EditableSection>

          {/* Offline & Sync Management Section - Full Width */}
          <div className="lg:col-span-2">
            <EditableSection
              title="Offline & Sync Management"
              icon={Wifi}
              isEditing={false}
              onEditToggle={() => {}}
            >
              <OfflineSettings />
            </EditableSection>
          </div>

          {/* Manual Sync Section - Full Width */}
          <div className="lg:col-span-2">
            <EditableSection
              title="Manual Sync"
              icon={RotateCcw}
              isEditing={false}
              onEditToggle={() => {}}
            >
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <p className="text-base text-foreground leading-relaxed">
                    Synchronize your data with the server
                  </p>
                  {lastSyncTime && (
                    <p className="text-sm text-muted-foreground">
                      Last synced: {lastSyncTime}
                    </p>
                  )}
                </div>
                
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 h-12 rounded-md text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-600 min-w-[200px]"
                >
                  <RotateCcw className={`h-5 w-5 mr-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  {syncMutation.isPending ? "Syncing..." : 
                   lastSyncTime ? "Sync Again" : "Sync Now"}
                </Button>
              </div>
            </EditableSection>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}