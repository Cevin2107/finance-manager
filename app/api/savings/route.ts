import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import Saving from '@/models/Saving';

// GET - Lấy danh sách savings
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

    const savings = await Saving.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ savings });
  } catch (error: any) {
    console.error('GET savings error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}

// POST - Tạo saving mới
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, targetAmount, targetDate, description, color } = await req.json();

    if (!name || !targetAmount || !targetDate) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    await dbConnect();

    const saving = await Saving.create({
      userId: session.user.id,
      name,
      targetAmount: parseFloat(targetAmount),
      targetDate: new Date(targetDate),
      description: description || '',
      color: color || '#3B82F6',
      currentAmount: 0,
    });

    return NextResponse.json(
      { 
        message: 'Tạo mục tiêu tiết kiệm thành công',
        saving 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST saving error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}

// PATCH - Cập nhật số tiền (nạp/rút)
export async function PATCH(req: NextRequest) {
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
    const { amount, type } = await req.json(); // type: 'deposit' | 'withdraw'

    if (!id || !amount || !type) {
      return NextResponse.json(
        { error: 'Thiếu thông tin' },
        { status: 400 }
      );
    }

    await dbConnect();

    const saving = await Saving.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!saving) {
      return NextResponse.json(
        { error: 'Không tìm thấy mục tiêu' },
        { status: 404 }
      );
    }

    const amountValue = parseFloat(amount);
    
    if (type === 'deposit') {
      saving.currentAmount += amountValue;
    } else if (type === 'withdraw') {
      if (saving.currentAmount < amountValue) {
        return NextResponse.json(
          { error: 'Số dư không đủ' },
          { status: 400 }
        );
      }
      saving.currentAmount -= amountValue;
    }

    await saving.save();

    return NextResponse.json({ 
      message: type === 'deposit' ? 'Nạp tiền thành công' : 'Rút tiền thành công',
      saving 
    });
  } catch (error: any) {
    console.error('PATCH saving error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa saving
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
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const saving = await Saving.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!saving) {
      return NextResponse.json(
        { error: 'Không tìm thấy mục tiêu' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Xóa mục tiêu thành công' 
    });
  } catch (error: any) {
    console.error('DELETE saving error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}
