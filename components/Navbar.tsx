'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut } from 'lucide-react';

interface NavbarProps {
  user?: { name: string; email: string; profile_image?: string };
}

export default function Navbar({ user }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-blue-600 text-white py-4 shadow-lg relative">
      <div className="flex justify-between items-center px-6">
        {/* Logo */}
        <Link href="/home" className="text-2xl font-bold hover:text-blue-200 transition-colors">
          TrelloClone
        </Link>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-400 p-1 rounded-full transition-colors"
            >
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                  <User size={24} {...({ className: "text-white" } as any)} />
                </div>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded-lg shadow-xl z-50">
                <div className="px-4 py-2 border-b">
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-sm text-gray-600 break-all">{user?.email}</p>
                </div>
                <Link
                  href="/settings/account"
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 w-full text-left rounded-b-lg"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {showUserMenu && (
        <div
          className="fixed inset-0 bg-transparent z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
}