import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import webpush from 'web-push';

// Configure web-push with VAPID keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'bdSiNzUhUP6ywdTCQuaXYuApVvbKUdwSrU-ZJ0LPxME'
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

async function getAIInsight(userId: string) {
  try {
    // Get user's recent transactions
    const Transaction = mongoose.models.Transaction;
    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    if (transactions.length === 0) {
      return 'Chưa có dữ liệu giao dịch. Hãy thêm giao dịch để nhận phân tích!';
    }

    // Calculate stats
    const income = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const expense = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const balance = income - expense;

    // Simple AI insight (3 sentences)
    let insight = '';
    
    if (balance > 0) {
      insight = `💰 Tài chính khả quan! Bạn đã tiết kiệm được ${balance.toLocaleString('vi-VN')}₫ trong thời gian gần đây. `;
    } else {
      insight = `⚠️ Chi tiêu vượt thu nhập ${Math.abs(balance).toLocaleString('vi-VN')}₫. Cần cân nhắc cắt giảm chi tiêu. `;
    }

    const avgDaily = expense / 30;
    insight += `Chi tiêu trung bình ${avgDaily.toLocaleString('vi-VN')}₫/ngày. `;
    
    const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(0) : 0;
    insight += `Tỷ lệ tiết kiệm: ${savingsRate}%.`;

    return insight;
  } catch (error) {
    console.error('AI Insight error:', error);
    return 'Chào buổi sáng! Hãy kiểm tra tài chính của bạn hôm nay.';
  }
}

export async function GET() {
  try {
    await dbConnect();

    const PushSubscription = mongoose.models.PushSubscription;
    if (!PushSubscription) {
      return NextResponse.json({ error: 'No subscriptions model' }, { status: 500 });
    }

    // Get all active subscriptions
    const subscriptions = await PushSubscription.find({}).populate('userId');

    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'No active subscriptions' });
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          // Get AI insight for this user
          const insight = await getAIInsight(sub.userId._id.toString());

          const payload = JSON.stringify({
            title: '☀️ Tóm tắt tài chính hôm nay',
            body: insight,
            icon: '/image.png',
            badge: '/image.png',
            data: {
              url: '/dashboard',
              timestamp: Date.now(),
            },
          });

          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
              },
            },
            payload
          );

          return { success: true, userId: sub.userId._id };
        } catch (error: any) {
          console.error('Send notification error:', error);
          
          // Remove invalid subscriptions
          if (error.statusCode === 410) {
            await PushSubscription.deleteOne({ _id: sub._id });
          }
          
          return { success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message: `Sent ${successful} notifications, ${failed} failed`,
      results,
    });
  } catch (error) {
    console.error('Send daily notifications error:', error);
    return NextResponse.json({
      error: 'Failed to send notifications',
    }, { status: 500 });
  }
}
