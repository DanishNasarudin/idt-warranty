"use client";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import ClerkProvider from "./providers/clerk-provider";
import { ThemeProvider } from "./providers/theme-provider";

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
