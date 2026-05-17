import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/features/website/lib/site";
import { GoogleAnalytics } from "@next/third-parties/google";

export const viewport: Viewport = {
  themeColor: "#0B0F0D",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Fitterverse",
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "fitness accountability partner",
    "diet accountability app",
    "workout consistency app",
    "healthy habit builder",
    "meal logging streak",
    "calorie deficit tracker",
    "BMR calculator app",
    "TDEE calculator free",
    "workout habit tracker",
    "health accountability app India",
  ],
  icons: {
    icon: [
      { url: "/favicons/favicon.svg", type: "image/svg+xml" },
      { url: "/favicons/favicon-32.svg", type: "image/svg+xml", sizes: "32x32" },
    ],
    apple: "/favicons/apple-touch-icon-180.svg",
  },
  manifest: "/favicons/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" />
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!} />
    </html>
  );
}
