import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthHydrator } from "@/components/providers/AuthHydrator";

export const metadata: Metadata = {
  title: "Kodemy — Learn by doing",
  description: "A minimalist LMS with strict video ordering, progress tracking, and YouTube-based learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AuthHydrator />
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            },
          }}
        />
      </body>
    </html>
  );
}
