import Sidebar from "@/components/custom/sidebar-wrapper";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Warranty Management - IDT",
  description: "Manage warranty cases and settings",
};

export default function WarrantyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen w-full flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full h-full p-3.5 overflow-auto">
        {children}
      </div>
    </div>
  );
}
