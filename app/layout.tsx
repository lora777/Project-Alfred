import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Alfred",
  description: "Home wildlife monitoring system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
