
import { NextResponse } from 'next/server';
import { mockUsers, mockIdentities } from '@/lib/mock-data';

export async function GET(
  request: Request,
  context: { params: { username: string } }
) {
  try {
    const username = context.params.username;
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
    const usernameForErrorLog = context && context.params ? context.params.username : "unknown_username";
    console.error(`Get Profile API error for ${usernameForErrorLog}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
