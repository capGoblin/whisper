'use client';

import React, { useState } from 'react';
import TopBar from '../navigation/TopBar';
import Sidebar from '../navigation/Sidebar';
import { cn } from '../../../lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        isSidebarOpen ? "ml-64" : "ml-16"
      )}>
        <TopBar />
        <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
          {children}
        </main>
        <footer className="bg-gray-900 text-gray-400 p-4 text-center text-sm shadow-inner mt-auto">
          <div className="container mx-auto max-w-full">
            © {new Date().getFullYear()} Whisper. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
