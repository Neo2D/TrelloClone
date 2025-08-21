import React, { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
  user?: { name: string; email: string; profile_image?: string };
}

export default function Layout({ children, user }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <main>{children}</main>
    </div>
  );
}