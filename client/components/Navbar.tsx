'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';

export default function Navbar() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Whisper</h1>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/send"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Send
            </Link>
            <Link
              href="/inbox"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Inbox
            </Link>

            <div className="flex items-center space-x-2">
              {!ready ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : authenticated ? (
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-600">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
                  </div>
                  <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1 px-3 rounded transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={login}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
