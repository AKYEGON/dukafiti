import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobilePageWrapperProps {
  children: ReactNode;
  className?: string;
  title?: string;
  showTitle?: boolean;
}

export function MobilePageWrapper({ 
  children, 
  className, 
  title, 
  showTitle = true 
}: MobilePageWrapperProps) {
  return (
    <div className={cn("w-full h-full bg-background text-foreground", className)}>
      {/* Desktop title - hidden on mobile since we have sticky header */}
      {showTitle && title && (
        <div className="hidden lg:block p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        </div>
      )}
      
      {/* Main content with mobile-first padding */}
      <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 w-full text-foreground">
        {children}
      </div>
    </div>
  );
}