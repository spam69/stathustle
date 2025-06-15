import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BlogModel from '@/models/Blog.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import mongoose from 'mongoose';

export async function GET() {
  await dbConnect();
  try {
    const blogs = await BlogModel.find()
      .populate('author')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json(blogs);
  } catch (error) {
    console.error('Get Blogs API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred while fetching blogs.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { title, slug, content, excerpt, coverImageUrl, authorId } = await request.json();

    if (!title || !slug || !content || !authorId) {
      return NextResponse.json({ message: 'Title, slug, content, and authorId are required.' }, { status: 400 });
    }

    // Find the author (either User or Identity)
    let authorDoc = await UserModel.findById(authorId).lean();
    let authorModelType: 'User' | 'Identity' = 'User';

    if (!authorDoc) {
      authorDoc = await IdentityModel.findById(authorId).lean();
      authorModelType = 'Identity';
    }

    if (!authorDoc) {
      return NextResponse.json({ message: 'Author not found.' }, { status: 404 });
    }

    // Check for existing blog with same slug for this author
    const existingBlog = await BlogModel.findOne({
      author: authorDoc._id,
      slug: slug.toLowerCase()
    });

    if (existingBlog) {
      return NextResponse.json({ message: `A blog post with this slug already exists for this author.` }, { status: 409 });
    }

    const newBlog = new BlogModel({
      author: authorDoc._id,
      authorModel: authorModelType,
      title,
      slug: slug.toLowerCase(),
      content,
      excerpt: excerpt || undefined,
      coverImageUrl: coverImageUrl || undefined,
    });

    await newBlog.save();

    // Populate the author field before sending response
    const populatedBlog = await BlogModel.findById(newBlog._id)
      .populate('author')
      .lean();

    return NextResponse.json(populatedBlog, { status: 201 });

  } catch (error) {
    console.error('Create Blog API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred while creating the blog post.' }, { status: 500 });
  }
}
