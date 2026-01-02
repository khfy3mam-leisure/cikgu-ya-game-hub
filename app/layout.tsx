import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cikgu Ya Game Hub",
  description: "Fun games for family gatherings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

