
// This file is no longer needed as NextAuth.js handles the /api/auth/signin route.
// You can delete this file: src/app/api/auth/login/route.ts
// Keeping it temporarily commented out to ensure no build issues if something still references it,
// but it should be removed.

/*
import { NextResponse } from 'next/server';
import { mockUsers } from '@/lib/mock-data';
import type { User } from '@/types';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = mockUsers.find(u => u.email === email);

    // In a real app, you would hash the password and compare
    if (user) { // Mocking password check
      // Return the user object, omitting sensitive data if any in a real scenario
      return NextResponse.json(user);
    } else {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
*/

import { NextResponse } from 'next/server';

// This route is now handled by NextAuth at /api/auth/[...nextauth]
// If direct access to /api/auth/login is attempted, we can return an error or redirect.
export async function GET(request: Request) {
  return NextResponse.json({ message: 'Login handled by NextAuth. Please use /api/auth/signin.' }, { status: 405 });
}
export async function POST(request: Request) {
  return NextResponse.json({ message: 'Login handled by NextAuth. Please use /api/auth/signin.' }, { status: 405 });
}
