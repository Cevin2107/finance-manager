import { Sidebar } from '@/components/dashboard/Sidebar';
import { RegisterServiceWorker } from '@/app/register-sw';
import { FinanceProvider } from '@/lib/finance-store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FinanceProvider>
      <RegisterServiceWorker />
      <div className="min-h-dvh bg-[#f7f8f6]">
        <Sidebar />
        <main className="min-h-dvh min-w-0 pt-[calc(4rem+env(safe-area-inset-top))] lg:ml-64 lg:pt-0">
          <div className="mx-auto w-full max-w-[1440px] px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </FinanceProvider>
  );
}
