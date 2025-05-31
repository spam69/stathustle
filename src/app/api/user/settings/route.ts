
import { NextResponse } from 'next/server';
import { mockUsers } from '@/lib/mock-data';
import type { User, SportInterest } from '@/types';

// This is a simplified example. In a real app, you'd get the authenticated user ID
// from a session or token, not passed in the body for sensitive updates.
export async function PUT(request: Request) {
  try {
    const { userId, sportInterests, themePreference, bio, profilePictureUrl, bannerImageUrl } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const userIndex = mockUsers.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const updatedUser = { ...mockUsers[userIndex] };

    if (sportInterests) {
      updatedUser.sportInterests = sportInterests as SportInterest[];
    }
    if (themePreference) {
      updatedUser.themePreference = themePreference as User['themePreference'];
    }
    if (bio !== undefined) {
      updatedUser.bio = bio;
    }
    if (profilePictureUrl !== undefined) {
      updatedUser.profilePictureUrl = profilePictureUrl;
    }
    if (bannerImageUrl !== undefined) {
      updatedUser.bannerImageUrl = bannerImageUrl;
    }
    // Add other updatable fields here (username, email would need more checks)

    mockUsers[userIndex] = updatedUser;

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update User Settings API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

    