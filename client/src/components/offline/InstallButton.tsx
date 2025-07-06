// DukaFiti PWA Install Button Component
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { pwaInstall } from '@/lib/sw-registration';
import { toast } from '@/hooks/use-toast';

export function InstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check install status periodically
    const checkInstallStatus = () => {
      setCanInstall(pwaInstall.canInstall());
      setIsInstalled(pwaInstall.isAppInstalled());
    };

    checkInstallStatus();
    
    // Check every 5 seconds for changes
    const interval = setInterval(checkInstallStatus, 5000);

    // Show install prompt after 30 seconds if installable and not shown before
    const promptTimer = setTimeout(() => {
      if (pwaInstall.canInstall() && !localStorage.getItem('pwa-prompt-dismissed')) {
        setShowPrompt(true);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(promptTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (!canInstall) return;

    setIsInstalling(true);
    try {
      const installed = await pwaInstall.showInstallPrompt();
      if (installed) {
        setCanInstall(false);
        setIsInstalled(true);
        setShowPrompt(false);
        
        toast({
          title: "DukaFiti Installed",
          description: "You can now access DukaFiti from your home screen",
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Installation failed:', error);
      toast({
        title: "Installation Failed",
        description: "Please try installing manually from your browser menu",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show anything if already installed
  if (isInstalled) {
    return null;
  }

  // Install prompt banner
  if (showPrompt && canInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
        <Card className="bg-gradient-to-r from-accent to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">Install DukaFiti</h3>
                  <p className="text-xs opacity-90">
                    Get the app for faster access and offline use
                  </p>
                </div>
              </div>
              <button
                onClick={dismissPrompt}
                className="text-white/80 hover:text-white p-1"
                aria-label="Dismiss install prompt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                size="sm"
                variant="secondary"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {isInstalling ? (
                  <>Installing...</>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Install
                  </>
                )}
              </Button>
              <Button
                onClick={dismissPrompt}
                size="sm"
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Simple install button for settings or other pages
  if (canInstall) {
    return (
      <Button
        onClick={handleInstall}
        disabled={isInstalling}
        variant="outline"
        className="w-full"
      >
        {isInstalling ? (
          <>Installing...</>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Install DukaFiti App
          </>
        )}
      </Button>
    );
  }

  // Manual install instructions for browsers that don't support prompt
  return (
    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Monitor className="h-5 w-5 text-blue-600" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
              Install DukaFiti
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {pwaInstall.getInstallInstructions()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default InstallButton;