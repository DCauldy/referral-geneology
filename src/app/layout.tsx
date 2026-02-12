import type { Metadata } from "next";
import { Inter, Libre_Baskerville } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://growyourtrellis.com"),
  title: {
    default: "Trellis",
    template: "%s | Trellis",
  },
  description:
    "Visualize and grow your referral network like never before. Track who referred whom, link referrals to deals, and get AI-powered insights.",
  openGraph: {
    title: "Trellis — Grow Your Referral Network",
    description:
      "Track, visualize, and grow your business referral network with AI-powered insights.",
    siteName: "Trellis",
    type: "website",
    locale: "en_US",
    url: "https://growyourtrellis.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trellis — Grow Your Referral Network",
    description:
      "Track, visualize, and grow your business referral network.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${libreBaskerville.variable}`}>
      <body className="min-h-screen bg-primary-50/50 font-sans antialiased dark:bg-primary-950">
        {children}
      </body>
    </html>
  );
}
