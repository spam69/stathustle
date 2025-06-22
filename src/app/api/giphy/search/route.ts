import { NextRequest, NextResponse } from 'next/server';
import { GiphyFetch } from '@giphy/js-fetch-api';

const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || '');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const { data } = await gf.search(query, {
      limit: 20,
      type: 'gifs',
      rating: 'g'
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Giphy search error:', error);
    return NextResponse.json(
      { error: 'Failed to search GIFs' },
      { status: 500 }
    );
  }
} 