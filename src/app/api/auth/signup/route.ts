
import { NextResponse } from 'next/server';
import { mockUsers, mockUser1 } from '@/lib/mock-data'; // Using mockUser1 for default fields
import type { User, SportInterest } from '@/types';

export async function POST(request: Request) {
  try {
    const { username, email, password, sportInterests, profilePictureUrl, bannerImageUrl, bio } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Username, email, and password are required' }, { status: 400 });
    }

    if (mockUsers.find(u => u.email === email)) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }
    if (mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
    }

    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username,
      email,
      password: password, // Store plain password for mock purposes
      sportInterests: sportInterests || [],
      profilePictureUrl: profilePictureUrl || mockUser1.profilePictureUrl, // Use default from mockUser1 if not provided
      bannerImageUrl: bannerImageUrl || mockUser1.bannerImageUrl,
      bio: bio || "",
      themePreference: 'light', // Default theme
      isIdentity: false,
    };

    mockUsers.push(newUser); // Add to in-memory array

    // Return the user object, but omit password for security best practice, even in mock
    const { password: _, ...userToReturn } = newUser;
    return NextResponse.json(userToReturn, { status: 201 });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
