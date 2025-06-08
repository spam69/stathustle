
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User.model';
import type { User as UserType } from '@/types'; 

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, displayName, email, password, sportInterests, profilePictureUrl, bannerImageUrl, bio } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Username, email, and password are required' }, { status: 400 });
    }

    const existingEmail = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    if (existingEmail) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }
    const existingUsername = await UserModel.findOne({ username: new RegExp(`^${username}$`, 'i') }).lean();
    if (existingUsername) {
      return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
    }
    
    const newUser = new UserModel({
      username,
      displayName: displayName || username, // Default displayName to username if not provided
      email: email.toLowerCase(),
      password: password, 
      sportInterests: sportInterests || [],
      profilePictureUrl: profilePictureUrl || `https://placehold.co/200x200.png?text=${(displayName || username)[0]?.toUpperCase() || 'U'}`, // Use displayName or username for placeholder
      bannerImageUrl: bannerImageUrl || `https://placehold.co/1200x300.png?text=Banner`,
      bio: bio || "",
      themePreference: 'system',
      isIdentity: false,
    });

    const savedUser = await newUser.save();

    const userToReturn = savedUser.toJSON();
    return NextResponse.json(userToReturn, { status: 201 });

  } catch (error: any) {
    console.error('Signup API error:', error);
    if (error.code === 11000) { 
      let field = 'unknown';
      if (error.keyPattern?.email) field = 'email';
      if (error.keyPattern?.username) field = 'username';
      return NextResponse.json({ message: `An account with this ${field} already exists.` }, { status: 409 });
    }
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
