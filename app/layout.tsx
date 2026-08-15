import type { Metadata } from "next";
import Link from "next/link";
import { Activity, LayoutDashboard, History } from "lucide-react";
import { SyncStatusBadge } from "@/components/dashboard/SyncStatusBadge";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlytBase GTM Intelligence",
  description: "Turns scattered customer signals into prioritized GTM decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased flex flex-col min-h-screen selection:bg-zinc-800 selection:text-white">
        {/* Top Enterprise Navigation Header */}
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-sm">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Brand Logo */}
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-6 h-6 rounded bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-xs">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-sm tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                    FlytBase
                  </span>
                  <span className="text-xs font-medium text-zinc-400">
                    GTM Intelligence
                  </span>
                </div>
              </Link>

              {/* Navigation Items */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-200 hover:text-white hover:bg-secondary/80 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Command Center</span>
                </Link>
                <Link
                  href="/changes"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-white hover:bg-secondary/80 transition-colors"
                >
                  <History className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Sync & Audit</span>
                </Link>
              </nav>
            </div>

            {/* Right Status */}
            <div className="flex items-center gap-3">
              <SyncStatusBadge />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-border/60 py-3.5 text-center text-xs text-zinc-500">
          <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>FlytBase Customer Success Book of Business Intelligence</span>
            <span>Source of Truth: FlytBase MCP Server</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
