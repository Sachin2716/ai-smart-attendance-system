import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAIAS — Smart Attendance Management Platform",
  description: "Enterprise-grade AI Smart Attendance System with Face Recognition, Server-Side RBAC, and Complete Governance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100">
        {children}
        <Toaster position="top-right" richColors theme="dark" closeButton />
      </body>
    </html>
  );
}
