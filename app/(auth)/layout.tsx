import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - IDT Warranty",
  description: "Sign in to access your warranty management dashboard",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex justify-center items-center min-h-screen w-full">
      {children}
    </div>
  );
}
