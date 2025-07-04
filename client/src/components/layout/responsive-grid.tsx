import { ReactNode } from "react"
import { cn } from "@/lib/utils"
interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: "sm" | "md" | "lg"
  minItemWidth?: string
}
export function ResponsiveGrid({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "md",
  minItemWidth = "300px"
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: "gap-3 sm:gap-4",
    md: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8"
  }
  // Build responsive grid classes
  const gridClasses = [
    `grid-cols-${columns.mobile}`,
    columns.tablet && `sm:grid-cols-${columns.tablet}`,
    columns.desktop && `lg:grid-cols-${columns.desktop}`
  ].filter(Boolean).join(" ")

  return (
    <div
      className = {cn(
        "grid",
        gridClasses,
        gapClasses[gap],
        className
      )}
      style = {{
        gridTemplateColumns: minItemWidth ? `repeat(auto-fit, minmax(${minItemWidth}, 1fr))` : undefined
      }}
    >
      {children}
    </div>
  )
}

// Responsive card component optimized for mobile and tablet
interface ResponsiveCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: "sm" | "md" | "lg"
}
export function ResponsiveCard({
  children,
  className,
  hover = true,
  padding = "md"
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: "p-4 sm:p-5",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8"
  }

  return (
    <div className = {cn(
      "bg-white dark:bg-[#1F1F1F] border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm",
      paddingClasses[padding],
      hover && "transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
      className
    )}>
      {children}
    </div>
  )
}