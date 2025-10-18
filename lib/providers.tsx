"use client";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import ClerkProvider from "./providers/clerk-provider";
import { ThemeProvider } from "./providers/theme-provider";

// Import fetch interceptor in development
// if (process.env.NODE_ENV === "development") {
//   import("./utils/fetch-interceptor");
// }

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ClerkProvider>
        {children}
        <Toaster richColors closeButton />
      </ClerkProvider>
    </ThemeProvider>
  );
}
