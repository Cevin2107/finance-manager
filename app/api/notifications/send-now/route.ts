import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if user has granted notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        // Send notification directly (for testing in browser)
        const notification = new Notification('🌙 Tóm tắt tài chính hôm nay', {
          body: '💰 Thu nhập ổn định. Chi tiêu hợp lý. Tiếp tục duy trì!',
          icon: '/image.png',
          badge: '/image.png',
          tag: 'daily-summary',
          requireInteraction: true,
        });
        
        notification.onclick = () => {
          window.focus();
          window.location.href = '/dashboard';
          notification.close();
        };
      }
    }
    
    // For server-side or Service Worker push
    // This will be called by the scheduled task
    return NextResponse.json({
      success: true,
      message: 'Notification sent at ' + new Date().toLocaleString('vi-VN'),
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json({
      error: 'Failed to send notification',
    }, { status: 500 });
  }
}
