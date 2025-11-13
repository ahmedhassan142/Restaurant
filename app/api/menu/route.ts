// app/api/menu/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MenuItem from '@/models/menu';
import Category from '@/models/category';
import FeaturedItem from '@/models/Featureditem';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const slug = searchParams.get('slug');
    const includeChildren = searchParams.get('includeChildren') === 'true';

    if (featured === 'true') {
      const featuredItems = await FeaturedItem.find({ isActive: true })
        .populate('menuItem')
        .sort({ order: 1 })
        .lean();

      return NextResponse.json({ featuredItems });
    }

    if (slug) {
      // Get menu items by category slug
      const categoryDoc = await Category.findOne({ slug, isActive: true });
      if (!categoryDoc) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      let categoryIds = [categoryDoc._id];
      
      // Include child categories if requested
      if (includeChildren && categoryDoc.children && categoryDoc.children.length > 0) {
        categoryIds = [...categoryIds, ...categoryDoc.children];
      }

      const menuItems = await MenuItem.find({ 
        category: { $in: categoryIds }, 
        isAvailable: true 
      })
      .populate('category')
      .sort({ price: 1 })
      .lean();

      return NextResponse.json({ 
        menuItems, 
        category: categoryDoc,
        includeChildren 
      });
    }

    if (category) {
      // Get menu items by category name
      const categoryDoc = await Category.findOne({ name: category, isActive: true });
      if (!categoryDoc) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      const menuItems = await MenuItem.find({ 
        category: categoryDoc._id, 
        isAvailable: true 
      })
      .populate('category')
      .sort({ price: 1 })
      .lean();

      return NextResponse.json({ menuItems, category: categoryDoc });
    }

    // Get all main categories (level 0) with their menu items
    const mainCategories = await Category.find({ 
      parent: null, 
      isActive: true 
    })
    .sort({ order: 1 })
    .lean();

    const menuData = await Promise.all(
      mainCategories.map(async (category) => {
        const items = await MenuItem.find({ 
          category: category._id, 
          isAvailable: true 
        })
        .sort({ price: 1 })
        .lean();

        // Get child categories if any
        const childCategories = await Category.find({ 
          parent: category._id, 
          isActive: true 
        })
        .sort({ order: 1 })
        .lean();

        return {
          ...category,
          items,
          childCategories,
          hasChildren: childCategories.length > 0
        };
      })
    );

    return NextResponse.json({ categories: menuData });

  } catch (error) {
    console.error('Menu API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu data' },
      { status: 500 }
    );
  }
}