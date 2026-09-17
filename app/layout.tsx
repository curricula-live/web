import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/styles/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "curricula.live",
  description: "Teacher-facing knowledge and planning tools.",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
