import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import dbConnect from '@/lib/db';
import Budget from '@/models/Budget';
import Transaction from '@/models/Transaction';

// GET - Lấy danh sách budgets
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
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const currentDate = new Date();
    const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const currentYear = year ? parseInt(year) : currentDate.getFullYear();

    // Lấy budgets
    const budgets = await Budget.find({
      userId: session.user.id,
      month: currentMonth,
      year: currentYear,
    }).lean();

    // Tính toán spent từ transactions
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await Transaction.aggregate([
          {
            $match: {
              userId: session.user.id,
              type: 'expense',
              category: budget.category,
              date: {
                $gte: startDate,
                $lte: endDate,
              },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]);

        const totalSpent = spent.length > 0 ? spent[0].total : 0;

        return {
          ...budget,
          spent: totalSpent,
          percentage: budget.limit > 0 ? (totalSpent / budget.limit) * 100 : 0,
        };
      })
    );

    return NextResponse.json({ budgets: budgetsWithSpent });
  } catch (error: any) {
    console.error('GET budgets error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}

// POST - Tạo hoặc cập nhật budget
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { category, limit, month, year } = await req.json();

    if (!category || !limit || !month || !year) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    if (limit <= 0) {
      return NextResponse.json(
        { error: 'Hạn mức phải lớn hơn 0' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Kiểm tra xem budget đã tồn tại chưa
    const existingBudget = await Budget.findOne({
      userId: session.user.id,
      category,
      month: parseInt(month),
      year: parseInt(year),
    });

    if (existingBudget) {
      // Cập nhật
      existingBudget.limit = parseFloat(limit);
      await existingBudget.save();

      return NextResponse.json({
        message: 'Cập nhật ngân sách thành công',
        budget: existingBudget,
      });
    } else {
      // Tạo mới
      const budget = await Budget.create({
        userId: session.user.id,
        category,
        limit: parseFloat(limit),
        month: parseInt(month),
        year: parseInt(year),
      });

      return NextResponse.json(
        {
          message: 'Tạo ngân sách thành công',
          budget,
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error('POST budget error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}

// DELETE - Xóa budget
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
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const budget = await Budget.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Xóa ngân sách thành công',
    });
  } catch (error: any) {
    console.error('DELETE budget error:', error);
    return NextResponse.json(
      { error: error.message || 'Đã có lỗi xảy ra' },
      { status: 500 }
    );
  }
}
