
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

    