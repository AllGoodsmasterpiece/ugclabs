import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./styles.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"]
});

export const metadata: Metadata = {
  title: "UGCLabs Product Focus MVP",
  description: "Internal product-focused short-form generator for UGCLabs."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
