import * as React from "react"

import { cn } from "@/lib/utils"

// Generate a unique ID for inputs without explicit id or name
const generateInputId = () => `input-${Math.random().toString(36).substr(2, 9)}`;

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, id, name, ...props }, ref) => {
    // Ensure either id or name is present for form field validation
    const inputId = id || name || generateInputId();
    const inputName = name || id;
    
    return (
      <input
        id={inputId}
        name={inputName}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
