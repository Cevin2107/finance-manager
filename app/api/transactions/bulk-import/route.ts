import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';

interface ImportTransaction {
  date: string;
  sender?: string;
  description: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transactions }: { transactions: ImportTransaction[] } = await req.json();

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 });
    }

    await dbConnect();

    // Prepare transactions for bulk insert
    const transactionsToInsert = transactions.map(tx => ({
      userId: session.user!.id,
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      description: tx.sender ? `${tx.sender} - ${tx.description}` : tx.description,
      date: new Date(tx.date),
      createdAt: new Date(),
    }));

    // Bulk insert
    const result = await Transaction.insertMany(transactionsToInsert);

    return NextResponse.json({
      success: true,
      imported: result.length,
      message: `Đã import ${result.length} giao dịch thành công`,
    });
  } catch (error: any) {
    console.error('Error importing transactions:', error);
    return NextResponse.json(
      { error: 'Failed to import transactions', details: error.message },
      { status: 500 }
    );
  }
}
