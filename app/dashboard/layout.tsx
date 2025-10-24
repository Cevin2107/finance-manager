'use client';

import { SessionProvider } from 'next-auth/react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { FloatingAIChat } from '@/components/dashboard/FloatingAIChat';
import { RegisterServiceWorker } from '@/app/register-sw';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <RegisterServiceWorker />
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-4 lg:p-8 pt-20 lg:pt-8">
            {children}
          </div>
        </main>
        
        {/* Floating AI Chat - xuất hiện ở tất cả các trang dashboard */}
        <FloatingAIChat />
      </div>
    </SessionProvider>
  );
}
