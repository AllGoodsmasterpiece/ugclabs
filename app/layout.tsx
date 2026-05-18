import type { Metadata } from "next";
import "./styles.css";

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
      <body>{children}</body>
    </html>
  );
}
