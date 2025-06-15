import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BlogModel from '@/models/Blog.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';

export async function GET(
  request: Request,
  { params }: { params: { username: string; blogSlug: string } }
) {
  await dbConnect();
  try {
    const { username, blogSlug } = params;

    // First find the author (either User or Identity)
    let author = await UserModel.findOne({ username: username.toLowerCase() }).lean();
    let authorModelType: 'User' | 'Identity' = 'User';

    if (!author) {
      author = await IdentityModel.findOne({ username: username.toLowerCase() }).lean();
      authorModelType = 'Identity';
    }

    if (!author) {
      return NextResponse.json({ message: 'Author not found.' }, { status: 404 });
    }

    // Find the blog post
    const blog = await BlogModel.findOne({
      author: author._id,
      slug: blogSlug.toLowerCase()
    })
    .populate('author')
    .lean();

    if (!blog) {
      return NextResponse.json({ message: 'Blog post not found.' }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    console.error('Get Blog API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred while fetching the blog post.' }, { status: 500 });
  }
}

    