import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white antialiased dark:bg-zinc-950">
        {children}
      </body>
    </html>
  );
}
