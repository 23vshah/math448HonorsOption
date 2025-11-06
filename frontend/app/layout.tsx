import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Option Pricing Simulator",
  description: "Compare Black-Scholes, Binomial, and Monte Carlo option pricing models",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

