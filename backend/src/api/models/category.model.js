import mongoose from 'mongoose';
import slugify from 'slugify';

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    icon: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
  },
  { timestamps: true },
);

CategorySchema.pre('save', function () {
  this.slug = slugify(this.name, { lower: true, strict: true });
});

const Category = mongoose.model('Category', CategorySchema);

export default Category;
