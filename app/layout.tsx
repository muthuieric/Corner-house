import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corner House · Pay",
  description:
    "Generate a payment QR code. A 10 bob (KES 10) service charge is added to every bill — if your bill is 100, you pay 110.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full scroll-smooth" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-background text-text-main antialiased">
        {children}
      </body>
    </html>
  );
}
