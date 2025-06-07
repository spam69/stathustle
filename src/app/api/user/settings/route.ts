
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User.model';
import type { User as UserType, SportInterest } from '@/types'; // UserType for consistency
import type { IUserSchema } from '@/models/User.model'; // Mongoose User document interface

export async function PUT(request: Request) {
  await dbConnect();

  try {
    const { userId, sportInterests, themePreference, bio, profilePictureUrl, bannerImageUrl } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const user: IUserSchema | null = await UserModel.findById(userId);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Update fields if they are provided in the request
    if (sportInterests !== undefined) {
      // Ensure sportInterests is an array of valid SportInterest objects
      // Mongoose will handle schema validation if SportInterestSchema is correctly defined in User.model.ts
      user.sportInterests = sportInterests as UserType['sportInterests'];
    }
    if (themePreference !== undefined) {
      user.themePreference = themePreference as UserType['themePreference'];
    }
    if (bio !== undefined) {
      user.bio = bio;
    }
    if (profilePictureUrl !== undefined) {
      user.profilePictureUrl = profilePictureUrl;
    }
    if (bannerImageUrl !== undefined) {
      user.bannerImageUrl = bannerImageUrl;
    }
    // Add other updatable fields here as needed, ensuring they exist on IUserSchema

    const updatedUserDoc = await user.save();
    const userToReturn = updatedUserDoc.toJSON(); // Leverages the transform in the schema

    return NextResponse.json(userToReturn);

  } catch (error: any) {
    console.error('Update User Settings API error:', error);
    // Handle potential Mongoose validation errors or other errors
    if (error.name === 'ValidationError') {
      return NextResponse.json({ message: 'Validation failed', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
