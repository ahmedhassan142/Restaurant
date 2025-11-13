// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '../../../models/category';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    let query: any = {};
    if (!includeInactive) {
      query.isActive = true;
    }

    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .populate('children', 'name slug order isActive')
      .sort({ level: 1, order: 1, name: 1 })
      .lean();

    // Build tree structure
    //@ts-ignore
    const buildTree = (items: any[], parentId: string | null = null) => {
      return items
        .filter(item => {
          if (parentId === null) return !item.parent;
          return item.parent?._id?.toString() === parentId;
        })
        //@ts-ignore
        .map((item:any) => ({
          ...item,
          children: buildTree(items, item._id.toString())
        }))
        .sort((a, b) => a.order - b.order);
    };

    const categoryTree = buildTree(categories);

    return NextResponse.json({ 
      categories: categoryTree,
      flatCategories: categories 
    });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const category = new Category(body);
    await category.save();

    // Update parent's children array
    if (body.parent) {
      await Category.findByIdAndUpdate(
        body.parent,
        { $addToSet: { children: category._id } }
      );
    }

    await category.populate('parent', 'name slug');
    await category.populate('children', 'name slug');

    return NextResponse.json(
      { 
        message: 'Category created successfully',
        category 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create category error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }
    
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