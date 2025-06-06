
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User.model';
import type { IUserSchema } from '@/models/User.model'; // For type hinting user doc

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { emailOrUsername, password } = await request.json();

    if (!emailOrUsername || !password) {
      return NextResponse.json({ message: 'Email/Username and password are required' }, { status: 400 });
    }

    // Find user by email or username (case-insensitive for username and email)
    const user: IUserSchema | null = await UserModel.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: new RegExp(`^${emailOrUsername}$`, 'i') }
      ],
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid email/username or password' }, { status: 401 });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid email/username or password' }, { status: 401 });
    }

    // Use toJSON to get the transformed object (id instead of _id, password excluded)
    const userToReturn = user.toJSON();
    return NextResponse.json(userToReturn, { status: 200 });

  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
