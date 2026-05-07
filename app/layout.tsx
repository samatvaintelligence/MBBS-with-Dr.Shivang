import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MBBS with Dr. Shivang — Admin",
  description: "Lead management and marketing analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
