
// This file is no longer used and can be deleted.
// Reactions are handled by /api/posts/[postId]/comments/[commentId]/react/route.ts

import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { postId: string; commentId: string } }
) {
  return NextResponse.json({ message: 'This endpoint is deprecated. Use /api/posts/[postId]/comments/[commentId]/react instead.' }, { status: 410 });
}
