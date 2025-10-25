'use client';

import { SessionProvider } from 'next-auth/react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { FloatingAIChat } from '@/components/dashboard/FloatingAIChat';
import { RegisterServiceWorker } from '@/app/register-sw';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (children !== displayChildren) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setIsAnimating(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [children, displayChildren]);

  return (
    <SessionProvider>
      <RegisterServiceWorker />
      <div className="min-h-screen">
        <Sidebar />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-4 lg:p-8 pt-20 lg:pt-8">
            <div 
              key={pathname}
              className={`transition-all duration-300 ${
                isAnimating 
                  ? 'opacity-0 translate-y-4' 
                  : 'opacity-100 translate-y-0'
              }`}
            >
              {displayChildren}
            </div>
          </div>
        </main>
        
        {/* Floating AI Chat - xuất hiện ở tất cả các trang dashboard */}
        <FloatingAIChat />
      </div>
    </SessionProvider>
  );
}
