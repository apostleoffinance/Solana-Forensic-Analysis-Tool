// app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Solana Forensic Analysis Tool",
  description: "earn.superteam.fun/",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="header">
          <div className="header-logo">
            <Link href="/">Solana Forensic</Link>
          </div>
          <nav className="header-nav">
            <Link href="/transation-flow">Transaction Flow</Link>
            <Link href="/transaction-clusters">Transaction Clusters</Link>
            <Link href="/entity-labels">Entity Labels</Link>
            <Link href="/wallet-analysis">Wallet Analysis</Link>
          </nav>
        </header>
        <main className="main">
          {children}
        </main>
      </body>
    </html>
  );
}