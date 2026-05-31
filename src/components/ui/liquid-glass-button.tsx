import React from "react"
import { cn } from "../../lib/utils"

export interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "sm" | "lg" | "xl" | "icon"
}

const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, size = "default", ...props }, ref) => {
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      xl: "h-14 rounded-full px-10 text-lg",
      icon: "h-10 w-10",
    }
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden font-medium transition-all hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-50",
          "bg-black/20 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]",
          sizes[size],
          className
        )}
        {...props}
      >
        <span className="relative z-10">{props.children}</span>
        {/* Simple liquid effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
      </button>
    )
  }
)
LiquidButton.displayName = "LiquidButton"

export { LiquidButton }
