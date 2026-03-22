import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthHydrator } from "@/components/providers/AuthHydrator";
import { Navbar } from "@/components/Layout/Navbar";

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontHeading = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: "Kodemy — Learn by doing",
  description:
    "A minimalist LMS with strict video ordering, progress tracking, and YouTube-based learning.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${fontSans.variable} ${fontHeading.variable}`}
    >
      <body className="font-sans antialiased">
        <AuthHydrator />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
        </div>
        <Toaster
          theme="dark"
          className="pointer-events-none [&_li]:pointer-events-auto"
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
