import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, Globe, RotateCcw, Download, Cloud, Moon, Sun, ChevronDown, ChevronRight } from "lucide-react";
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
import { MobilePageWrapper } from "@/components/layout/mobile-page-wrapper";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Form validation schemas
const storeProfileSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  address: z.string().min(1, "Address is required"),
});

type StoreProfileData = z.infer<typeof storeProfileSchema>;

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
}

interface UserSettingsData {
  language?: 'en' | 'sw';
}

export default function SettingsPage() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'sw'>('en');
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

  // Initialize language from settings
  useEffect(() => {
    if (userSettings?.language) {
      setCurrentLanguage(userSettings.language);
    }
  }, [userSettings]);

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

  // Data export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/export/all");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Data exported successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Export failed", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  // Event handlers
  const onStoreSubmit = (data: StoreProfileData) => {
    storeMutation.mutate(data);
  };

  const handleLanguageChange = (language: 'en' | 'sw') => {
    setCurrentLanguage(language);
    languageMutation.mutate(language);
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

      {/* Language Settings Section */}
      <Card className="bg-white dark:bg-card border-gray-200 dark:border-border">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t.languageToggle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={currentLanguage === 'en' ? 'default' : 'outline'}
              onClick={() => handleLanguageChange('en')}
              disabled={languageMutation.isPending}
              className={currentLanguage === 'en' ? 'bg-green-500 hover:bg-green-600 text-foreground' : ''}
            >
              {t.english}
            </Button>
            <Button
              variant={currentLanguage === 'sw' ? 'default' : 'outline'}
              onClick={() => handleLanguageChange('sw')}
              disabled={languageMutation.isPending}
              className={currentLanguage === 'sw' ? 'bg-green-500 hover:bg-green-600 text-foreground' : ''}
            >
              {t.kiswahili}
            </Button>
          </div>
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

      {/* Data Backup Section */}
      <Card className="bg-white dark:bg-card border-gray-200 dark:border-border">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-foreground flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            {t.dataBackup}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="w-full bg-purple-500 hover:bg-purple-600 text-foreground"
          >
            <Download className="h-4 w-4 mr-2" />
            {exportMutation.isPending ? t.backingUp : t.exportAllData}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}