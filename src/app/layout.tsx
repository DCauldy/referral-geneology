import type { Metadata } from "next";
import { Nunito, Libre_Baskerville } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
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
  title: "Referral Genealogy",
  description:
    "Visualize and grow your referral network like never before. Track who referred whom, link referrals to deals, and get AI-powered insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${nunito.variable} ${libreBaskerville.variable}`}>
      <body className="min-h-screen bg-amber-50/30 font-sans antialiased dark:bg-stone-950">
        {children}
      </body>
    </html>
  );
}
