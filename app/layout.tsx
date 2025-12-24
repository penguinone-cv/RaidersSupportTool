import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/mobile-nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'ARC Raiders Support Tool',
    description: 'ARC Raiders攻略・管理ツール - アイテム管理、パーティー編成、設計図トラッキング',
    keywords: ['ARC Raiders', '攻略', 'クラフト', 'レシピ', '素材'],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body className={cn(inter.className, 'min-h-screen bg-background antialiased')}>
                {/* Main container */}
                <div className="min-h-screen flex flex-col">
                    {/* Header */}
                    <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
                        <div className="container mx-auto px-4">
                            <div className="flex h-16 items-center justify-between">
                                {/* Logo */}
                                <Link href="/" className="flex items-center gap-3 group">
                                    <div className="relative">
                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                            <svg
                                                className="h-6 w-6 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-bold text-lg tracking-tight text-foreground">
                                            ARC Raiders
                                        </span>
                                        <span className="hidden sm:inline text-green-600 font-medium ml-2">
                                            Support Tool
                                        </span>
                                    </div>
                                </Link>

                                {/* Navigation - Responsive */}
                                <MobileNav />
                            </div>
                        </div>
                    </header>

                    {/* Main content */}
                    <main className="flex-1 container mx-auto px-4 py-6">
                        {children}
                    </main>

                    {/* Footer */}
                    <footer className="border-t border-border bg-card">
                        <div className="container mx-auto px-4 py-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
                                <p>
                                    Data provided by{' '}
                                    <a
                                        href="https://metaforge.app/arc-raiders"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-600 hover:text-green-700 underline underline-offset-2"
                                    >
                                        MetaForge
                                    </a>
                                </p>
                                <p className="text-xs">
                                    This is a fan-made tool. Not affiliated with Embark Studios.
                                </p>
                            </div>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    );
}
