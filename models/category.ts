// models/Category.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  image?: string;
  parent?: mongoose.Types.ObjectId;
  children: mongoose.Types.ObjectId[];
  isActive: boolean;
  order: number;
  level: number;
  path: string[];
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  image: {
    type: String,
    default: '/images/default-category.jpg'
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  children: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 0
  },
  path: [{
    type: String
  }],
  slug: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full category path
CategorySchema.virtual('fullPath').get(function() {
    //@ts-ignore
  return this.path.join(' > ');
});

// Generate slug before saving
CategorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    //@ts-ignore
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await mongoose.model('Category').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }

  // Calculate level and path
  if (this.parent) {
    const parent = await mongoose.model('Category').findById(this.parent);
    this.level = parent ? parent.level + 1 : 0;
    this.path = parent ? [...parent.path, this.name] : [this.name];
  } else {
    this.level = 0;
    this.path = [this.name];
  }

  next();
});

// Update children when parent changes
CategorySchema.post('save', async function() {
  if (this.isModified('parent') || this.isModified('name')) {
    // Update all children's paths
    const children = await mongoose.model('Category').find({ parent: this._id });
    for (const child of children) {
      await child.save();
    }
  }
});

// Static method to build tree structure
CategorySchema.statics.buildTree = function(categories: any[], parentId: string | null = null) {
  return categories
    .filter(category => {
      if (parentId === null) return !category.parent;
      return category.parent?.toString() === parentId;
    })
    .map(category => ({
      ...category.toObject ? category.toObject() : category,
      //@ts-ignore
      children: this.buildTree(categories, category._id.toString())
    }))
    .sort((a, b) => a.order - b.order);
};

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);