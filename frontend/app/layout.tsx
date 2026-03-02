import type { Metadata } from "next";

import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";


export const metadata: Metadata = {
  title: "Sales Management Portal",
  description: "Internal sales portal with Okta auth and Salesforce integration.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
