import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/app/providers";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "AI Detective Agency",
    template: "%s | AI Detective Agency",
  },
  description:
    "An AI-powered detective agency where intelligent agents help you investigate cases, analyze evidence, and solve mysteries.",
  keywords: ["AI", "detective", "mystery", "Gemini", "investigation", "agents"],
  authors: [{ name: "AI Detective Agency" }],
  openGraph: {
    type: "website",
    title: "AI Detective Agency",
    description: "Solve mysteries with the power of AI detective agents.",
    siteName: "AI Detective Agency",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#211a19] text-[#f5f3f0] min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

