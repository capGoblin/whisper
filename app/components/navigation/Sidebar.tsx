'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Send, Inbox, Key, Settings, HelpCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '../../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/send', icon: Send, label: 'Send' },
    { href: '/inbox', icon: Inbox, label: 'Inbox' },
    { href: '/keys', icon: Key, label: 'Keys' },
    { href: '/settings', icon: Settings, label: 'Settings' },
    { href: '/help', icon: HelpCircle, label: 'Help' },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 bg-gray-900 text-white shadow-lg",
        "transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16",
        "flex flex-col"
      )}
    >
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center p-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors",
              pathname === item.href && "bg-primary-dark text-white",
              isOpen ? "justify-start" : "justify-center"
            )}
          >
            <item.icon className={cn("h-5 w-5", isOpen && "mr-3")} />
            {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={toggleSidebar}
          className={cn(
            "w-full flex items-center p-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors",
            isOpen ? "justify-end" : "justify-center"
          )}
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3H3.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
}
