"use client"
import { toast as originalToast } from "@/components/ui/use-toast"

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  // Add other properties as needed
}

interface CustomToastOptions extends Omit<ToastOptions, "className"> {
  type?: "success" | "error" | "warning" | "info"
}

export const toast = (options: CustomToastOptions) => {
  const { type = "info", ...rest } = options

  // Add custom styling based on type
  let variantStyle: "default" | "destructive" = "default"

  if (type === "error") {
    variantStyle = "destructive"
  }

  return originalToast({
    ...rest,
    variant: variantStyle,
  })
}

