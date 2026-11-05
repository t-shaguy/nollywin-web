import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  /**
   * Additional classes for the container
   */
  className?: string;
  /**
   * Max width constraint (default: max-w-6xl for most pages)
   * Use "none" to allow full width
   */
  maxWidth?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl";
  /**
   * Whether to center the content horizontally (default: true)
   */
  centered?: boolean;
}

/**
 * Page container component for consistent responsive padding and max-width
 * across all pages.
 * 
 * Padding progression:
 * - Mobile (320-767px): 16px horizontal
 * - Tablet (768-1023px): 24px horizontal
 * - Desktop (1024px+): 32px horizontal
 * 
 * Usage:
 * ```tsx
 * <PageContainer>
 *   <h1>Page Title</h1>
 *   <div>Content...</div>
 * </PageContainer>
 * ```
 */
export function PageContainer({
  children,
  className,
  maxWidth = "6xl",
  centered = true,
}: PageContainerProps) {
  const maxWidthClass = maxWidth === "none" ? "" : `max-w-${maxWidth}`;
  
  return (
    <div
      className={cn(
        "w-full",
        maxWidthClass,
        centered && "mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
