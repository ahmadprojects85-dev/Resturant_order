import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "The Coffee House | Order",
  description: "Scan, Order, Enjoy.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Coffee House",
  },
  other: {
    "mobile-web-app-capable": "yes",
  }
};

export const viewport = {
  themeColor: "#C4602A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* iOS PWA — required for push notifications on iPhone (iOS 16.4+) */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Coffee House" />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

