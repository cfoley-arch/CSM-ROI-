import type { Metadata } from "next";
import { Marcellus } from "next/font/google";
import "./globals.css";

// Display font stand-in for GT Ultra Median (Section 6) — GT Ultra Median
// isn't web-licensed for this internal tool, so the doc's stated
// alternative (Marcellus, via Google Fonts) is used for headlines instead.
const marcellus = Marcellus({
  variable: "--font-marcellus",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSM ROI Statement",
  description: "ClearCompany CSM ROI calculator and statement generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${marcellus.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cc-white text-cc-cast-iron">{children}</body>
    </html>
  );
}
