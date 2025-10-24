import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { endpoint } = await request.json();
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    // Delete subscription
    const PushSubscription = mongoose.models.PushSubscription;
    if (PushSubscription) {
      await PushSubscription.deleteOne({ endpoint });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription removed successfully' 
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ 
      error: 'Failed to remove subscription' 
    }, { status: 500 });
  }
}
