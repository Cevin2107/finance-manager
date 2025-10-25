// Client-side notification scheduler
export class NotificationScheduler {
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  static scheduleDaily(hour: number, minute: number, callback: () => void) {
    // Clear existing timer if any
    this.cancelDaily();

    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (now >= scheduledTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    console.log('⏰ Scheduling daily notification:');
    console.log('  - Current time:', now.toLocaleString('vi-VN'));
    console.log('  - Scheduled for:', scheduledTime.toLocaleString('vi-VN'));
    console.log('  - Delay (minutes):', Math.round(delay / 1000 / 60));
    console.log('  - Delay (ms):', delay);

    const timer = setTimeout(() => {
      console.log('⏰ Timer triggered! Sending notification...');
      callback();
      // Reschedule for next day
      console.log('♻️ Rescheduling for next day...');
      this.scheduleDaily(hour, minute, callback);
    }, delay);

    this.timers.set('daily', timer);
    console.log('✅ Timer set successfully, ID:', timer);

    // Also save to localStorage as backup
    const scheduleInfo = {
      hour,
      minute,
      scheduledTime: scheduledTime.toISOString(),
      setAt: now.toISOString(),
    };
    localStorage.setItem('notificationSchedule', JSON.stringify(scheduleInfo));
    console.log('💾 Schedule saved to localStorage:', scheduleInfo);

    return scheduledTime;
  }

  static cancelDaily() {
    const timer = this.timers.get('daily');
    if (timer) {
      console.log('🛑 Cancelling existing timer:', timer);
      clearTimeout(timer);
      this.timers.delete('daily');
      localStorage.removeItem('notificationSchedule');
      console.log('✅ Timer cancelled and removed from localStorage');
    } else {
      console.log('ℹ️ No timer to cancel');
    }
  }

  static getScheduleInfo() {
    const scheduleInfo = localStorage.getItem('notificationSchedule');
    if (scheduleInfo) {
      try {
        const info = JSON.parse(scheduleInfo);
        const scheduledTime = new Date(info.scheduledTime);
        const now = new Date();
        const timeUntil = scheduledTime.getTime() - now.getTime();
        
        return {
          ...info,
          scheduledTime: scheduledTime,
          timeUntilMs: timeUntil,
          timeUntilMinutes: Math.round(timeUntil / 1000 / 60),
          isActive: this.timers.has('daily'),
          isPast: timeUntil < 0,
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  static async sendDailyNotification() {
    console.log('🔔 sendDailyNotification called');
    
    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported in this browser');
      alert('Trình duyệt không hỗ trợ thông báo');
      return;
    }

    console.log('✅ Notification API available');
    console.log('📋 Current permission:', Notification.permission);

    if (Notification.permission !== 'granted') {
      console.error('❌ Notification permission not granted:', Notification.permission);
      alert('Quyền thông báo chưa được cấp. Vui lòng bật thông báo trong cài đặt trình duyệt.');
      return;
    }

    console.log('✅ Permission granted, fetching AI insight...');

    try {
      // Get AI insight using POST method
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to get AI insight: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 AI Data received:', data);

      const notificationTitle = '☀️ Tóm tắt tài chính hôm nay';
      const notificationBody = data.summary || 'Kiểm tra tài chính của bạn hôm nay!';

      console.log('📬 Preparing notification:', { title: notificationTitle, body: notificationBody });

      // Try Service Worker with timeout, fallback to direct Notification
      let notificationShown = false;

      if ('serviceWorker' in navigator) {
        console.log('🔧 Trying Service Worker...');
        try {
          // Set a timeout for service worker ready
          const swPromise = navigator.serviceWorker.ready;
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Service Worker timeout')), 3000)
          );

          const registration = await Promise.race([swPromise, timeoutPromise]) as ServiceWorkerRegistration;
          console.log('✅ Service Worker ready:', registration);
          
          await registration.showNotification(notificationTitle, {
            body: notificationBody,
            icon: '/image.png',
            badge: '/image.png',
            tag: 'daily-summary',
            requireInteraction: true,
            data: {
              url: '/dashboard',
              timestamp: Date.now(),
            },
          });
          console.log('✅ Notification shown via Service Worker');
          notificationShown = true;
        } catch (swError) {
          console.warn('⚠️ Service Worker failed:', swError);
          console.log('📱 Falling back to direct Notification API...');
        }
      }

      // Fallback to direct Notification API if Service Worker failed or not available
      if (!notificationShown) {
        console.log('📱 Using direct Notification API...');
        
        // Try to bring window to focus first
        try {
          window.focus();
        } catch (e) {
          console.warn('Could not focus window:', e);
        }
        
        const notification = new Notification(notificationTitle, {
          body: notificationBody,
          icon: '/image.png',
          tag: 'daily-summary',
          requireInteraction: true,
          silent: false, // Make sure it's not silent
        });

        // Add event handlers
        notification.onshow = () => {
          console.log('🎉 Notification displayed on screen!');
        };
        
        notification.onerror = (e) => {
          console.error('❌ Notification error:', e);
        };
        
        notification.onclose = () => {
          console.log('Notification closed');
        };

        notification.onclick = function(event) {
          console.log('Notification clicked!');
          event.preventDefault();
          window.focus();
          window.location.href = '/dashboard';
          notification.close();
        };
        console.log('✅ Notification shown via direct Notification API');
      }

      console.log('✅ Daily notification sent at:', new Date().toLocaleString('vi-VN'));
    } catch (error) {
      console.error('❌ Failed to send daily notification:', error);
      
      // Send a fallback notification even if AI fails
      try {
        console.log('⚠️ Sending fallback notification...');
        
        const fallbackTitle = '☀️ Nhắc nhở tài chính';
        const fallbackBody = 'Hãy kiểm tra thu chi của bạn hôm nay!';
        
        // Try direct notification first for fallback
        const fallbackNotification = new Notification(fallbackTitle, {
          body: fallbackBody,
          icon: '/image.png',
          tag: 'daily-summary',
          requireInteraction: true,
        });

        fallbackNotification.onclick = function(event) {
          event.preventDefault();
          window.focus();
          window.location.href = '/dashboard';
          fallbackNotification.close();
        };
        console.log('✅ Fallback notification shown via Notification API');
      } catch (fallbackError) {
        console.error('❌ Failed to send fallback notification:', fallbackError);
        alert('Lỗi khi gửi thông báo: ' + (fallbackError as Error).message);
      }
    }
  }
}
