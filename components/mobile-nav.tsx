'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Package, Wrench, Search, Target, ClipboardList, LayoutDashboard, Users } from 'lucide-react';

const navItems = [
    { href: '/', label: 'アイテム', icon: Package },
    { href: '/recipes', label: 'レシピ', icon: Wrench },
    { href: '/materials', label: '素材逆引き', icon: Search },
    { href: '/quests', label: 'クエスト', icon: Target },
    { href: '/wishlist', label: 'ウィッシュリスト', icon: ClipboardList },
    { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { href: '/party', label: 'パーティー', icon: Users },
];

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close menu on navigation
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <div ref={menuRef} className="relative">
            {/* Hamburger Button - Mobile Only */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="メニュー"
            >
                {isOpen ? (
                    <X className="h-6 w-6 text-gray-700" />
                ) : (
                    <Menu className="h-6 w-6 text-gray-700" />
                )}
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                    ? 'text-green-700 bg-green-50'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border-2 border-gray-200 py-2 z-50 md:hidden">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${isActive
                                        ? 'text-green-700 bg-green-50'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
