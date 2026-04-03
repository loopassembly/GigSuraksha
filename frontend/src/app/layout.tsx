import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "GigSuraksha — Income Protection for Delivery Partners",
  description:
    "AI-enabled parametric income protection for quick-commerce delivery riders. Protect your weekly earnings from rain, heat, AQI spikes, and platform outages.",
  keywords: [
    "gig economy",
    "delivery partner",
    "income protection",
    "parametric insurance",
    "quick commerce",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1D4ED8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        {children}
      </body>
    </html>
  );
}
