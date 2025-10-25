import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinanceApp - Quản lý tài chính cá nhân",
  description: "Ứng dụng quản lý tài chính thông minh, hiện đại và dễ sử dụng",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinanceApp",
  },
  applicationName: "FinanceApp",
  themeColor: "#3B82F6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      { url: "/image.png", sizes: "any", type: "image/png" },
      { url: "/image.png", sizes: "192x192", type: "image/png" },
      { url: "/image.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/image.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/image.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FinanceApp" />
        <link rel="apple-touch-icon" href="/image.png" />
        <link rel="icon" type="image/png" href="/image.png" />
        {/* Initialize theme before the app renders to avoid flash */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var k='theme';var c='dark';var d=document.documentElement;var s=localStorage.getItem(k);var sys=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s||'system';if(t==='dark'||(t==='system'&&sys)){d.classList.add(c);}else{d.classList.remove(c);}}catch(e){}})();`}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
