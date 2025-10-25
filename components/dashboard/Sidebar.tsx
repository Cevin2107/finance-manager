'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Bell,
  BellOff,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Giao dịch', href: '/dashboard/transactions', icon: Receipt },
  { name: 'Tiết kiệm', href: '/dashboard/budget', icon: PiggyBank },
  { name: 'Báo cáo', href: '/dashboard/reports', icon: BarChart3 },
];

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoadingNotification, setIsLoadingNotification] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const saved = localStorage.getItem('notificationsEnabled');
      setNotificationsEnabled(saved === 'true' && Notification.permission === 'granted');
      
      // Schedule daily notifications if enabled
      if (saved === 'true' && Notification.permission === 'granted') {
        import('@/lib/notification-scheduler').then(({ NotificationScheduler }) => {
          // Schedule for 7:00 AM daily
          NotificationScheduler.scheduleDaily(7, 0, () => {
            NotificationScheduler.sendDailyNotification();
          });
          console.log('Daily notifications scheduled for 7:00 AM');
        });
      }
    }
    // Initialize theme state + system listener
    let mql: MediaQueryList | null = null;
    const initTheme = () => {
      try {
        const d = document.documentElement;
        const stored = (localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null) || 'system';
        setThemeMode(stored);
        const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const dark = stored === 'dark' || (stored === 'system' && systemDark);
        d.classList.toggle('dark', dark);
        setIsDarkMode(dark);
      } catch (e) {
        // ignore
      }
    };

    initTheme();
    if (window.matchMedia) {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        if (themeMode === 'system') {
          const dark = e.matches;
          document.documentElement.classList.toggle('dark', dark);
          setIsDarkMode(dark);
        }
      };
      mql.addEventListener('change', handler);
      return () => {
        mql && mql.removeEventListener('change', handler);
      };
    }
  }, [themeMode]);

  const setTheme = (mode: 'light' | 'dark' | 'system') => {
    try {
      setThemeMode(mode);
      localStorage.setItem('theme', mode);
      const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = mode === 'dark' || (mode === 'system' && systemDark);
      document.documentElement.classList.toggle('dark', dark);
      setIsDarkMode(dark);
    } catch (e) {
      console.error('Theme set error:', e);
    }
  };

  const toggleNotifications = async () => {
    console.log('Toggle notifications clicked');
    
    if (!('Notification' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ thông báo');
      return;
    }

    setIsLoadingNotification(true);

    try {
      if (!notificationsEnabled) {
        console.log('Requesting notification permission...');
        
        // Request permission first
        const permission = await Notification.requestPermission();
        console.log('Permission result:', permission);
        
        if (permission !== 'granted') {
          alert('Bạn cần cho phép thông báo để sử dụng tính năng này');
          setIsLoadingNotification(false);
          return;
        }

        // Save to localStorage
        localStorage.setItem('notificationsEnabled', 'true');
        setNotificationsEnabled(true);
        
        // Schedule daily notifications
        import('@/lib/notification-scheduler').then(({ NotificationScheduler }) => {
          NotificationScheduler.scheduleDaily(7, 0, () => {
            NotificationScheduler.sendDailyNotification();
          });
          console.log('Daily notifications scheduled for 7:00 AM');
        });
        
        // Show test notification using Service Worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(async (registration) => {
            await registration.showNotification('🎉 Thông báo đã bật!', {
              body: 'Bạn sẽ nhận được tóm tắt AI Insight mỗi ngày lúc 7:00 sáng',
              icon: '/image.png',
            });
          }).catch(err => {
            console.error('Failed to show notification:', err);
            // Fallback if service worker not available
            new Notification('🎉 Thông báo đã bật!', {
              body: 'Bạn sẽ nhận được tóm tắt AI Insight mỗi ngày lúc 7:00 sáng',
              icon: '/image.png',
            });
          });
        } else {
          // Fallback for browsers without service worker
          new Notification('🎉 Thông báo đã bật!', {
            body: 'Bạn sẽ nhận được tóm tắt AI Insight mỗi ngày lúc 7:00 sáng',
            icon: '/image.png',
          });
        }
        
        // Try to register with service worker if available (optional)
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(async (registration) => {
            try {
              const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
                )
              });
              
              // Save to backend (optional, won't block UI)
              fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription }),
              }).catch(err => console.log('Backend save failed:', err));
            } catch (err) {
              console.log('Push subscription failed (optional):', err);
            }
          }).catch(err => {
            console.log('Service worker not ready (optional):', err);
          });
        }
        
        console.log('Notifications enabled successfully!');
      } else {
        // Disable notifications
        console.log('Disabling notifications...');
        
        localStorage.setItem('notificationsEnabled', 'false');
        setNotificationsEnabled(false);
        
        // Cancel scheduled notifications
        import('@/lib/notification-scheduler').then(({ NotificationScheduler }) => {
          NotificationScheduler.cancelDaily();
          console.log('Daily notifications cancelled');
        });
        
        // Try to unsubscribe from service worker if available
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(async (registration) => {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              await subscription.unsubscribe();
              fetch('/api/notifications/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: subscription.endpoint }),
              }).catch(err => console.log('Backend unsubscribe failed:', err));
            }
          }).catch(err => {
            console.log('Service worker not available:', err);
          });
        }
        
        console.log('Notifications disabled');
        alert('✅ Đã tắt thông báo');
      }
    } catch (error) {
      console.error('Notification toggle error:', error);
      alert('Có lỗi xảy ra: ' + (error as Error).message);
    } finally {
      setIsLoadingNotification(false);
      console.log('Toggle complete');
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-lg text-gray-900 dark:text-gray-100"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 z-40',
          'transform transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          {
            'translate-x-0': isMobileMenuOpen,
            '-translate-x-full': !isMobileMenuOpen,
          }
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  FinanceApp
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quản lý tài chính
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    {
                      'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50':
                        isActive,
                      'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700':
                        !isActive,
                    }
                  )}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-gray-200 dark:border-slate-700">
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session?.user?.email}
                  </p>
                </div>
                <ChevronDown
                  size={20}
                  className={clsx(
                    'transition-transform text-gray-500 dark:text-gray-400',
                    isUserMenuOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
                  {/* Theme Selector */}
                  <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Giao diện</div>
                  <button
                    onClick={() => setTheme('system')}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-slate-700',
                      themeMode === 'system' ? 'bg-gray-100 dark:bg-slate-700' : ''
                    )}
                  >
                    <Monitor size={18} className="text-blue-500" />
                    <span className="text-sm flex-1 text-left text-gray-900 dark:text-gray-100">Theo hệ thống</span>
                    {themeMode === 'system' && <span className="text-xs text-blue-500">Đang dùng</span>}
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-slate-700',
                      themeMode === 'light' ? 'bg-gray-100 dark:bg-slate-700' : ''
                    )}
                  >
                    <Sun size={18} className="text-amber-500" />
                    <span className="text-sm flex-1 text-left text-gray-900 dark:text-gray-100">Sáng</span>
                    {themeMode === 'light' && <span className="text-xs text-amber-500">Đang dùng</span>}
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-slate-700',
                      themeMode === 'dark' ? 'bg-gray-100 dark:bg-slate-700' : ''
                    )}
                  >
                    <Moon size={18} className="text-purple-500" />
                    <span className="text-sm flex-1 text-left text-gray-900 dark:text-gray-100">Tối</span>
                    {themeMode === 'dark' && <span className="text-xs text-purple-500">Đang dùng</span>}
                  </button>

                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-900 dark:text-gray-100"
                  >
                    <User size={18} />
                    <span className="text-sm">Thông tin cá nhân</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-900 dark:text-gray-100"
                  >
                    <Settings size={18} />
                    <span className="text-sm">Cài đặt</span>
                  </Link>
                  
                  {/* Notification Toggle */}
                  <button
                    onClick={toggleNotifications}
                    disabled={isLoadingNotification}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border-t border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      {notificationsEnabled ? (
                        <Bell size={18} className="text-blue-600" />
                      ) : (
                        <BellOff size={18} className="text-gray-400" />
                      )}
                      <span className="text-sm">
                        {notificationsEnabled ? 'Tắt thông báo' : 'Bật thông báo'}
                      </span>
                    </div>
                    <div className={clsx(
                      'w-10 h-6 rounded-full p-1 transition-colors',
                      notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600',
                      isLoadingNotification && 'opacity-50'
                    )}>
                      <div className={clsx(
                        'w-4 h-4 rounded-full bg-white transition-transform',
                        notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                      )} />
                    </div>
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors border-t border-gray-200 dark:border-slate-700"
                  >
                    <LogOut size={18} />
                    <span className="text-sm">Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
