import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Store, Download, Globe, RotateCcw, Shield } from "lucide-react";

// Schema for store profile form
const storeProfileSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  address: z.string().min(1, "Address is required"),
});

// Schema for M-Pesa credentials form
const mpesaCredentialsSchema = z.object({
  paybillTillNumber: z.string().regex(/^\d+$/, "Must be a valid number"),
  consumerKey: z.string().min(1, "Consumer key is required"),
  consumerSecret: z.string().min(1, "Consumer secret is required"),
});

type StoreProfileData = z.infer<typeof storeProfileSchema>;
type MpesaCredentialsData = z.infer<typeof mpesaCredentialsSchema>;

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
}

// Basic translations (stubbed)
const translations = {
  en: {
    settings: "Settings",
    storeProfile: "Store Profile",
    mpesaCredentials: "M-Pesa Credentials",
    languageToggle: "Language",
    manualSync: "Manual Sync",
    dataBackup: "Data Backup",
    storeName: "Store Name",
    ownerName: "Owner Name",
    address: "Address",
    paybillTill: "Paybill/Till Number",
    consumerKey: "Consumer Key",
    consumerSecret: "Consumer Secret",
    saveProfile: "Save Profile",
    saveMpesa: "Save M-Pesa Settings",
    english: "English",
    kiswahili: "Kiswahili",
    syncNow: "Sync Now",
    downloadBackup: "Download Backup",
    saving: "Saving...",
    syncing: "Syncing...",
  },
  sw: {
    settings: "Mipangilio",
    storeProfile: "Maelezo ya Duka",
    mpesaCredentials: "Ufunguo wa M-Pesa",
    languageToggle: "Lugha",
    manualSync: "Sawazisha Mwenyewe",
    dataBackup: "Hifadhi ya Data",
    storeName: "Jina la Duka",
    ownerName: "Jina la Mmiliki",
    address: "Anwani",
    paybillTill: "Nambari ya Paybill/Till",
    consumerKey: "Ufunguo wa Mteja",
    consumerSecret: "Siri ya Mteja",
    saveProfile: "Hifadhi Maelezo",
    saveMpesa: "Hifadhi Mipangilio ya M-Pesa",
    english: "Kiingereza",
    kiswahili: "Kiswahili",
    syncNow: "Sawazisha Sasa",
    downloadBackup: "Pakua Hifadhi",
    saving: "Inahifadhi...",
    syncing: "Inasawazisha...",
  }
};

export default function Settings() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'sw'>('en');
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Data backup function
  const handleDataBackup = async () => {
    try {
      const response = await apiRequest("GET", "/api/backup");
      const data = await response.json();
      
      // Create and download backup file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dukasmart-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Backup downloaded successfully" });
    } catch (error) {
      toast({ 
        title: "Backup failed", 
        description: "Please try again",
        variant: "destructive" 
      });
    }
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

  if (storeLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-green-500/10 rounded-lg">
          <Store className="h-6 w-6 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t.settings}</h1>
      </div>

      {/* Store Profile Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-green-500 flex items-center gap-2">
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
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-green-500 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t.mpesaCredentials}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...mpesaForm}>
            <form onSubmit={mpesaForm.handleSubmit(onMpesaSubmit)} className="space-y-4">
              <FormField
                control={mpesaForm.control}
                name="paybillTillNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">{t.paybillTill}</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-gray-800 border-gray-700 text-white" />
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
                      <Input {...field} className="bg-gray-800 border-gray-700 text-white" />
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
                        className="bg-gray-800 border-gray-700 text-white" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={mpesaMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {mpesaMutation.isPending ? t.saving : t.saveMpesa}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Language Toggle Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-green-500 flex items-center gap-2">
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

      {/* Manual Sync Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-green-500 flex items-center gap-2">
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
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-green-500 flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t.dataBackup}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleDataBackup}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {t.downloadBackup}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}