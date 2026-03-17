import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "EngCoach | AI English Conversation Trainer",
  description: "Master English expressions with AI-powered conversation practice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} bg-[#0f172a]`}>
      <body className="antialiased font-outfit bg-[#0f172a] text-slate-100">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
