import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NxtWave Workshop Growth Engine",
  description: "Referral and AI evaluation app for NxtWave's free AI workshop."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
