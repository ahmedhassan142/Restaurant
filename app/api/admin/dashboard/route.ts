// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Reservation from '@/models/reservation';
import MenuItem from '@/models/menu';
import Order from '@/models/order';
import FeaturedItem from '@/models/Featureditem';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total reservations
    const totalReservations = await Reservation.countDocuments();

    // Active reservations (today and future)
    const activeReservations = await Reservation.countDocuments({
      date: { $gte: new Date().setHours(0, 0, 0, 0) },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Revenue calculations
    const monthlyOrders = await Order.find({
      createdAt: { $gte: startOfMonth },
      status: 'completed'
    });
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total, 0);

    const lastMonthOrders = await Order.find({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      status: 'completed'
    });
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);

    // Menu items count
    const totalMenuItems = await MenuItem.countDocuments({ isAvailable: true });
    const featuredItems = await FeaturedItem.countDocuments({ isActive: true });

    // Popular items (based on order frequency)
    const popularItems = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          orderCount: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 5 }
    ]);

    // Recent reservations
    const recentReservations = await Reservation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name guests date time status')
      .lean();

    const stats = {
      totalReservations,
      activeReservations,
      totalRevenue: monthlyRevenue + lastMonthRevenue,
      monthlyRevenue,
      totalMenuItems,
      featuredItems,
      popularItems,
      recentReservations
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}