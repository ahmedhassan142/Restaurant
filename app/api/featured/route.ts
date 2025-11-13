// app/api/featured/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import FeaturedItem from '@/models/Featureditem';

// GET all featured items (public)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const adminView = searchParams.get('admin') === 'true';

    let query: any = {};
    
    if (!includeInactive && !adminView) {
      query.isActive = true;
      
      // Filter by date range for public API
      const now = new Date();
      query.$and = [
        { $or: [{ startDate: { $lte: now } }, { startDate: null }] },
        { $or: [{ endDate: { $gte: now } }, { endDate: null }] }
      ];
    }

    const featuredItems = await FeaturedItem.find(query)
      .populate('menuItem')
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Filter out featured items where menuItem is not available (for public API)
    const validFeaturedItems = featuredItems.filter(item => 
      adminView || (item.menuItem && item.menuItem.isAvailable)
    );

    return NextResponse.json({ featuredItems: validFeaturedItems });
  } catch (error) {
    console.error('Featured items API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured items' },
      { status: 500 }
    );
  }
}

// POST new featured item (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const featuredItem = new FeaturedItem(body);
    await featuredItem.save();

    await featuredItem.populate('menuItem');

    return NextResponse.json(
      { 
        message: 'Featured item created successfully',
        featuredItem 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create featured item error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}