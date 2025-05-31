
import { NextResponse } from 'next/server';
import { mockUsers, mockIdentities } from '@/lib/mock-data';

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    await new Promise(resolve => setTimeout(resolve, 200));

    let profile = mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!profile) {
      profile = mockIdentities.find(i => i.username.toLowerCase() === username.toLowerCase());
    }

    if (profile) {
      return NextResponse.json(profile);
    } else {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Get Profile API error for ${params.username}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

    