// app/api/featured/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import FeaturedItem from '@/models/Featureditem';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const featuredItem = await FeaturedItem.findById(params.id)
      .populate('menuItem')
      .lean();

    if (!featuredItem) {
      return NextResponse.json(
        { error: 'Featured item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ featuredItem });
  } catch (error) {
    console.error('Get featured item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const featuredItem = await FeaturedItem.findById(params.id);
    
    if (!featuredItem) {
      return NextResponse.json(
        { error: 'Featured item not found' },
        { status: 404 }
      );
    }

    Object.assign(featuredItem, body);
    await featuredItem.save();

    await featuredItem.populate('menuItem');

    return NextResponse.json({
      message: 'Featured item updated successfully',
      featuredItem
    });
  } catch (error: any) {
    console.error('Update featured item error:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const featuredItem = await FeaturedItem.findById(params.id);
    
    if (!featuredItem) {
      return NextResponse.json(
        { error: 'Featured item not found' },
        { status: 404 }
      );
    }

    await FeaturedItem.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: 'Featured item deleted successfully'
    });
  } catch (error) {
    console.error('Delete featured item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}