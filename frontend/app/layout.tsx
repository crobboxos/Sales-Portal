import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const primaryFont = Inter({
  subsets: ["latin"],
  variable: "--font-primary",
  display: "swap"
});

const dataFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-data",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Software Licensing Portal",
  description: "Salesforce software licensing opportunity submission portal"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${primaryFont.variable} ${dataFont.variable}`}>{children}</body>
    </html>
  );
}
