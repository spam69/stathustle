
import { NextResponse } from 'next/server';
import { mockBlogs } from '@/lib/mock-data';

export async function GET() {
  await new Promise(resolve => setTimeout(resolve, 200));
  return NextResponse.json(mockBlogs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
}

    