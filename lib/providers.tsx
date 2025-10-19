"use client";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import ClerkProvider from "./providers/clerk-provider";
import { ThemeProvider } from "./providers/theme-provider";
import { VersionCheckProvider } from "./providers/version-check-provider";

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
        <VersionCheckProvider>
          {children}
          <Toaster richColors closeButton />
        </VersionCheckProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}
