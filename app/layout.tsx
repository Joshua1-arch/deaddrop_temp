import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";
import { WalletProvider } from "@/components/WalletProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DeadDrop — Censorship-Resistant, Time-Locked Publishing",
  description:
    "Securely publish and time-lock documents on Sui blockchain and Walrus decentralized storage. Untamperable digital permanence.",
  keywords: ["Sui", "Walrus Protocol", "Time-Lock", "Censorship-Resistant", "Decentralized Storage", "Cryptography"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="font-sans bg-background-primary text-text-primary min-h-screen flex flex-col antialiased selection:bg-accent-primary/20 selection:text-accent-primary custom-scrollbar">
        <WalletProvider>
          {process.env.NODE_ENV === 'development' && 
           (!process.env.NEXT_PUBLIC_PACKAGE_ID || 
            process.env.NEXT_PUBLIC_PACKAGE_ID.replace(
              /0/g, ''
            ) === 'x') && (
            <div style={{
              background: '#FF4444',
              color: 'white',
              padding: '8px',
              textAlign: 'center',
              fontSize: '12px'
            }}>
              ⚠️ PACKAGE_ID not set. 
              Deploy contract and update .env.local
            </div>
          )}
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
