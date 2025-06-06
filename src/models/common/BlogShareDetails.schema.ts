
import { Schema } from 'mongoose';
import type { BlogShareDetails as BlogShareDetailsType } from '@/types';

// Interface for Mongoose sub-document
// No direct document extension as it's embedded.
// The fields directly map from BlogShareDetailsType.

const BlogShareDetailsSchema = new Schema<BlogShareDetailsType>({
  title: { type: String, required: true },
  url: { type: String, required: true },
  authorDisplayName: { type: String, required: true },
  authorUsername: { type: String, required: true },
  excerpt: { type: String },
  coverImageUrl: { type: String },
}, { _id: false });

export default BlogShareDetailsSchema;
