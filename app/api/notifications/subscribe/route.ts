import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

// Schema for push subscriptions
const PushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

const PushSubscription = mongoose.models.PushSubscription || mongoose.model('PushSubscription', PushSubscriptionSchema);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { subscription } = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Find user by email
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}));
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Save or update subscription
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: user._id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Subscription saved successfully' 
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ 
      error: 'Failed to save subscription' 
    }, { status: 500 });
  }
}
