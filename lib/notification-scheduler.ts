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

    console.log('Scheduling notification for:', scheduledTime.toLocaleString('vi-VN'));
    console.log('Delay (minutes):', Math.round(delay / 1000 / 60));

    const timer = setTimeout(() => {
      callback();
      // Reschedule for next day
      this.scheduleDaily(hour, minute, callback);
    }, delay);

    this.timers.set('daily', timer);

    return scheduledTime;
  }

  static cancelDaily() {
    const timer = this.timers.get('daily');
    if (timer) {
      clearTimeout(timer);
      this.timers.delete('daily');
    }
  }

  static async sendDailyNotification() {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    try {
      // Get AI insight using POST method
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Failed to get AI insight: ${response.status}`);
      }

      const data = await response.json();

      const notification = new Notification('☀️ Tóm tắt tài chính hôm nay', {
        body: data.summary || 'Kiểm tra tài chính của bạn hôm nay!',
        icon: '/image.png',
        badge: '/image.png',
        tag: 'daily-summary',
        requireInteraction: true,
        data: {
          url: '/dashboard',
          timestamp: Date.now(),
        },
      });

      notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        if (notification.data?.url) {
          window.location.href = notification.data.url;
        }
        notification.close();
      };

      console.log('Daily notification sent at:', new Date().toLocaleString('vi-VN'));
    } catch (error) {
      console.error('Failed to send daily notification:', error);
      
      // Send a fallback notification even if AI fails
      const fallbackNotification = new Notification('☀️ Nhắc nhở tài chính', {
        body: 'Hãy kiểm tra thu chi của bạn hôm nay!',
        icon: '/image.png',
        badge: '/image.png',
        tag: 'daily-summary',
        data: {
          url: '/dashboard',
          timestamp: Date.now(),
        },
      });

      fallbackNotification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        window.location.href = '/dashboard';
        fallbackNotification.close();
      };
    }
  }
}
