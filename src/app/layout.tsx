import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "EngCoach | AI 영어 회화 트레이너",
  description: "AI 최적화 회화 연습을 통한 영어 표현 마스터하기.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${outfit.variable} bg-[#fffafa]`}>
      <body className="antialiased font-outfit bg-[#fffafa] text-gray-800">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
