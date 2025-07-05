import { ReactNode } from "react"
import { cn } from "@/lib/utils"
interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  padding?: "none" | "sm" | "md" | "lg"
}
export function ResponsiveContainer({
  children,
  className,
  maxWidth = "full",
  padding = "md"
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    "2xl": "max-w-8xl",
    full: "max-w-full"
  }

  const paddingClasses = {
    none: "",
    sm: "px-4 py-4 sm:px-6 sm:py-6",
    md: "px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8",
    lg: "px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-12 lg:py-12"
  }

  return (
    <div className = {cn(
      "container mx-auto",
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}