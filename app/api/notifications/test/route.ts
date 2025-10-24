import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Schedule notification for 7:00 AM
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(7, 0, 0, 0); // 7:00 AM
    
    // If it's already past 7:00 AM today, schedule for tomorrow
    if (now >= targetTime) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    const delay = targetTime.getTime() - now.getTime();
    const delayInMinutes = Math.round(delay / 1000 / 60);
    
    console.log('Current time:', now.toLocaleString('vi-VN'));
    console.log('Target time:', targetTime.toLocaleString('vi-VN'));
    console.log('Delay in minutes:', delayInMinutes);
    
    // Send notification after delay
    setTimeout(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send-now`, {
          method: 'GET',
        });
        
        const result = await response.json();
        console.log('Notification sent at 11:58 PM:', result);
      } catch (error) {
        console.error('Failed to send scheduled notification:', error);
      }
    }, delay);
    
    return NextResponse.json({
      success: true,
      message: `Đã đặt lịch gửi thông báo lúc ${targetTime.toLocaleString('vi-VN')}`,
      currentTime: now.toLocaleString('vi-VN'),
      scheduledTime: targetTime.toLocaleString('vi-VN'),
      delayInMinutes,
    });
  } catch (error) {
    console.error('Schedule error:', error);
    return NextResponse.json({
      error: 'Failed to schedule notification',
    }, { status: 500 });
  }
}
