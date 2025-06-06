
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User.model';
import type { User as UserType } from '@/types'; // Keep for request body typing

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, email, password, sportInterests, profilePictureUrl, bannerImageUrl, bio } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Username, email, and password are required' }, { status: 400 });
    }

    const existingEmail = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }
    const existingUsername = await UserModel.findOne({ username: new RegExp(`^${username}$`, 'i') }); // Case-insensitive check
    if (existingUsername) {
      return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
    }

    // Password hashing should be done here or in pre-save hook
    // For now, storing as is, but THIS IS NOT SECURE FOR PRODUCTION
    const newUser = new UserModel({
      username,
      email: email.toLowerCase(),
      password: password, // Store plain password for now, add hashing!
      sportInterests: sportInterests || [],
      profilePictureUrl: profilePictureUrl || `https://placehold.co/200x200.png?text=${username[0]?.toUpperCase() || 'U'}`,
      bannerImageUrl: bannerImageUrl || `https://placehold.co/1200x300.png?text=Banner`,
      bio: bio || "",
      themePreference: 'system',
      isIdentity: false,
    });

    const savedUser = await newUser.save();

    // Use toJSON to get the transformed object (id instead of _id, password excluded)
    const userToReturn = savedUser.toJSON();
    return NextResponse.json(userToReturn, { status: 201 });

  } catch (error: any) {
    console.error('Signup API error:', error);
    if (error.code === 11000) { // MongoDB duplicate key error
      if (error.keyPattern?.email) {
        return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
      }
      if (error.keyPattern?.username) {
        return NextResponse.json({ message: 'Username already taken.' }, { status: 409 });
      }
    }
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
