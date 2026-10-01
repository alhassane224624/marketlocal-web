import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MarketLocal — Le local à portée de clic",
  description: "Marketplace locale pour découvrir, acheter et vendre des produits authentiques.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body className={`${geistSans.variable} ${geistMono.variable}`}><Providers>{children}</Providers></body></html>;
}
