import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "The Coffee House | Order",
  description: "Scan, Order, Enjoy.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
