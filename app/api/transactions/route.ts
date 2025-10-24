import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';

// GET - Lấy danh sách transactions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = { userId: session.user.id };

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error('GET transactions error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}

// POST - Tạo transaction mới
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { type, category, amount, description, date } = await req.json();

    if (!type || !category || !amount) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { error: 'Loại giao dịch không hợp lệ' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Parse date với timezone local
    let transactionDate = new Date();
    if (date) {
      // Nếu date là yyyy-MM-dd (10 ký tự), thêm giờ hiện tại
      if (date.length === 10) {
        // Parse date string theo local timezone, không phải UTC
        const [year, month, day] = date.split('-').map(Number);
        const now = new Date();
        transactionDate = new Date(
          year,
          month - 1, // JavaScript months are 0-indexed
          day,
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds()
        );
      } else {
        // Full datetime string được gửi lên
        transactionDate = new Date(date);
      }
    }

    const transaction = await Transaction.create({
      userId: session.user.id,
      type,
      category,
      amount: parseFloat(amount),
      description: description || '',
      date: transactionDate,
    });

    return NextResponse.json(
      { 
        message: 'Tạo giao dịch thành công',
        transaction 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa transaction
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Xóa giao dịch thành công' 
    });
  } catch (error: any) {
    console.error('DELETE transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}
