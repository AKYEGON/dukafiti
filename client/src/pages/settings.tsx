import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, Shield, Globe, RotateCcw, Download, Cloud, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/contexts/theme-context";

// Form validation schemas
const storeProfileSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  address: z.string().min(1, "Address is required"),
});

const mpesaCredentialsSchema = z.object({
  paybillTillNumber: z.string().min(1, "Paybill/Till number is required"),
  consumerKey: z.string().min(1, "Consumer key is required"),
  consumerSecret: z.string().min(1, "Consumer secret is required"),
});

type StoreProfileData = z.infer<typeof storeProfileSchema>;
type MpesaCredentialsData = z.infer<typeof mpesaCredentialsSchema>;

// Translation object
const translations = {
  en: {
    settings: "Settings",
    storeProfile: "Store Profile",
    storeName: "Store Name",
    ownerName: "Owner Name",
    address: "Address",
    saveProfile: "Save Profile",
    saving: "Saving...",
    mpesaCredentials: "M-Pesa Credentials",
    enableMpesa: "Enable M-Pesa payments",
    paybillTill: "Paybill/Till Number",
    consumerKey: "Consumer Key",
    consumerSecret: "Consumer Secret",
    saveMpesa: "Save M-Pesa Settings",
    languageToggle: "Language Settings",
    english: "English",
    kiswahili: "Kiswahili",
    darkMode: "Dark Mode",
    darkModeDesc: "Switch between light and dark themes",
    manualSync: "Manual Sync",
    syncNow: "Sync Now",
    syncing: "Syncing...",
    dataBackup: "Data Backup",
    exportAllData: "Export All Data",
    backupToGoogleDrive: "Backup to Google Drive",
    backingUp: "Backing up...",
  },
  sw: {
    settings: "Mipangilio",
    storeProfile: "Maelezo ya Duka",
    storeName: "Jina la Duka",
    ownerName: "Jina la Mmiliki",
    address: "Anwani",
    saveProfile: "Hifadhi Maelezo",
    saving: "Inahifadhi...",
    mpesaCredentials: "Ufunguo wa M-Pesa",
    enableMpesa: "Wezesha malipo ya M-Pesa",
    paybillTill: "Nambari ya Paybill/Till",
    consumerKey: "Ufunguo wa Mtumizi",
    consumerSecret: "Ufunguo wa Siri",
    saveMpesa: "Hifadhi Mipangilio ya M-Pesa",
    languageToggle: "Mipangilio ya Lugha",
    english: "Kiingereza",
    kiswahili: "Kiswahili",
    darkMode: "Mfumo wa Giza",
    darkModeDesc: "Badilisha kati ya mandhari ya mwanga na giza",
    manualSync: "Sawazisho la Mwongozo",
    syncNow: "Sawazisha Sasa",
    syncing: "Inasawazisha...",
    dataBackup: "Hifadhi ya Data",
    exportAllData: "Pakua Data Yote",
    backupToGoogleDrive: "Hifadhi kwa Google Drive",
    backingUp: "Inahifadhi...",
  }
};

interface StoreData {
  storeName?: string;
  ownerName?: string;
  address?: string;
  paybillTillNumber?: string;
  consumerKey?: string;
  consumerSecret?: string;
}

interface UserSettingsData {
  language?: 'en' | 'sw';
  mpesaEnabled?: boolean;
}

export default function SettingsPage() {
  console.log(">>> Loading COMPREHENSIVE Settings Page <<<");
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'sw'>('en');
  const [mpesaEnabled, setMpesaEnabled] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const t = translations[currentLanguage];

  // Fetch store data
  const { data: storeData, isLoading: storeLoading } = useQuery<StoreData>({
    queryKey: ['/api/store'],
    retry: false,
  });

  // Fetch user settings
  const { data: userSettings } = useQuery<UserSettingsData>({
    queryKey: ['/api/settings'],
    retry: false,
  });

  // Fetch M-Pesa enabled status
  const { data: mpesaEnabledData } = useQuery<{ enabled: boolean }>({
    queryKey: ['/api/settings/mpesa-enabled'],
    retry: false,
  });

  // Initialize language from settings
  useEffect(() => {
    if (userSettings?.language) {
      setCurrentLanguage(userSettings.language);
    }
  }, [userSettings]);

  // Initialize M-Pesa enabled state
  useEffect(() => {
    if (mpesaEnabledData) {
      setMpesaEnabled(mpesaEnabledData.enabled);
    }
  }, [mpesaEnabledData]);

  // Store profile form
  const storeForm = useForm<StoreProfileData>({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: {
      storeName: "",
      ownerName: "",
      address: "",
    },
  });

  // M-Pesa credentials form
  const mpesaForm = useForm<MpesaCredentialsData>({
    resolver: zodResolver(mpesaCredentialsSchema),
    defaultValues: {
      paybillTillNumber: "",
      consumerKey: "",
      consumerSecret: "",
    },
  });

  // Update forms when store data loads
  useEffect(() => {
    if (storeData) {
      storeForm.reset({
        storeName: storeData.storeName || "",
        ownerName: storeData.ownerName || "",
        address: storeData.address || "",
      });
      mpesaForm.reset({
        paybillTillNumber: storeData.paybillTillNumber || "",
        consumerKey: storeData.consumerKey || "",
        consumerSecret: storeData.consumerSecret || "",
      });
    }
  }, [storeData, storeForm, mpesaForm]);

  // Store profile mutation
  const storeProfileMutation = useMutation({
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

  // M-Pesa credentials mutation
  const mpesaMutation = useMutation({
    mutationFn: async (data: MpesaCredentialsData) => {
      const response = await apiRequest("PUT", "/api/store/mpesa", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "M-Pesa settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/store'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update M-Pesa settings", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Language change mutation
  const languageMutation = useMutation({
    mutationFn: async (language: 'en' | 'sw') => {
      const response = await apiRequest("POST", "/api/settings/language", { language });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Language updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update language", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // M-Pesa enabled toggle mutation
  const mpesaEnabledMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest("PUT", "/api/settings/mpesa-enabled", { enabled });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "M-Pesa settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/mpesa-enabled'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update M-Pesa settings", 
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

  // Google Drive backup mutation
  const googleDriveBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/backup/google-drive");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Backup sent to Google Drive",
        description: `File: ${data.filename || 'backup file'}`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Google Drive backup failed", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Export all data function
  const handleExportAllData = async () => {
    try {
      const response = await apiRequest("GET", "/api/backup");
      const data = await response.json();
      
      // Create and download backup file with comprehensive data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dukasmart-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ 
        title: "Data exported successfully",
        description: "All business data downloaded as JSON file"
      });
    } catch (error) {
      toast({ 
        title: "Export failed", 
        description: "Please try again",
        variant: "destructive" 
      });
    }
  };

  // Google Drive backup handler
  const handleGoogleDriveBackup = () => {
    googleDriveBackupMutation.mutate();
  };

  const handleLanguageChange = (language: 'en' | 'sw') => {
    setCurrentLanguage(language);
    languageMutation.mutate(language);
  };

  const onStoreSubmit = (data: StoreProfileData) => {
    storeProfileMutation.mutate(data);
  };

  const onMpesaSubmit = (data: MpesaCredentialsData) => {
    mpesaMutation.mutate(data);
  };

  const handleMpesaToggle = (enabled: boolean) => {
    setMpesaEnabled(enabled);
    mpesaEnabledMutation.mutate(enabled);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.settings}</h1>
      </div>

      {/* Store Profile Section */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-green-500 flex items-center gap-2">
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
                    <FormLabel className="text-white">{t.storeName}</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-gray-800 border-gray-700 text-white" />
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
                    <FormLabel className="text-white">{t.ownerName}</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-gray-800 border-gray-700 text-white" />
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
                    <FormLabel className="text-white">{t.address}</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="bg-gray-800 border-gray-700 text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={storeProfileMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {storeProfileMutation.isPending ? t.saving : t.saveProfile}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* M-Pesa Credentials Section */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-green-500 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t.mpesaCredentials}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* M-Pesa Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex-1">
                <Label htmlFor="mpesa-toggle" className="text-white font-medium">
                  {t.enableMpesa}
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  {mpesaEnabled 
                    ? "M-Pesa payments are enabled for your store" 
                    : "Enable M-Pesa to accept mobile payments"
                  }
                </p>
              </div>
              <Switch
                id="mpesa-toggle"
                checked={mpesaEnabled}
                onCheckedChange={handleMpesaToggle}
                disabled={mpesaEnabledMutation.isPending}
                className={`${!mpesaEnabled ? 'data-[state=unchecked]:bg-red-600' : ''}`}
              />
            </div>
            
            {/* M-Pesa Credentials Form */}
            <div className={`transition-opacity duration-200 ${!mpesaEnabled ? 'opacity-50' : ''}`}>
              <Form {...mpesaForm}>
                <form onSubmit={mpesaForm.handleSubmit(onMpesaSubmit)} className="space-y-4">
              <FormField
                control={mpesaForm.control}
                name="paybillTillNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">{t.paybillTill}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={!mpesaEnabled}
                        className="bg-gray-800 border-gray-700 text-white" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={mpesaForm.control}
                name="consumerKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">{t.consumerKey}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        disabled={!mpesaEnabled}
                        className="bg-gray-800 border-gray-700 text-white" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={mpesaForm.control}
                name="consumerSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">{t.consumerSecret}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        disabled={!mpesaEnabled}
                        className="bg-gray-800 border-gray-700 text-white" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={mpesaMutation.isPending || !mpesaEnabled}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {mpesaMutation.isPending ? t.saving : t.saveMpesa}
              </Button>
                </form>
              </Form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Toggle Section */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-green-500 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t.languageToggle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={currentLanguage === 'en' ? 'default' : 'outline'}
              onClick={() => handleLanguageChange('en')}
              className={currentLanguage === 'en' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'border-gray-700 text-gray-300 hover:bg-gray-800'
              }
            >
              {t.english}
            </Button>
            <Button
              variant={currentLanguage === 'sw' ? 'default' : 'outline'}
              onClick={() => handleLanguageChange('sw')}
              className={currentLanguage === 'sw' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'border-gray-700 text-gray-300 hover:bg-gray-800'
              }
            >
              {t.kiswahili}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dark Mode Toggle Section */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-green-500 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            {t.darkMode}
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t.darkModeDesc}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode-toggle" className="text-gray-700 dark:text-gray-300">
              {theme === 'dark' ? t.darkMode : 'Light Mode'}
            </Label>
            <Switch
              id="dark-mode-toggle"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Manual Sync Section */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-green-500 flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            {t.manualSync}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            {syncMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            {syncMutation.isPending ? t.syncing : t.syncNow}
          </Button>
        </CardContent>
      </Card>

      {/* Data Backup Section */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-green-500 flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t.dataBackup}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExportAllData}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 flex-1"
            >
              <Download className="h-4 w-4" />
              {t.exportAllData}
            </Button>
            <Button
              onClick={handleGoogleDriveBackup}
              disabled={googleDriveBackupMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 flex-1"
            >
              {googleDriveBackupMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Cloud className="h-4 w-4" />
              )}
              {googleDriveBackupMutation.isPending ? t.backingUp : t.backupToGoogleDrive}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}