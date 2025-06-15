import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import IdentityModel from '@/models/Identity.model';
import UserModel from '@/models/User.model'; // To verify owner
import type { Identity as IdentityType } from '@/types';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { 
      username, 
      displayName, 
      email, 
      bio, 
      ownerId, 
      profilePictureUrl, 
      bannerImageUrl 
    } = await request.json();

    if (!username || !ownerId) {
      return NextResponse.json({ message: 'Username and ownerId are required' }, { status: 400 });
    }

    // Validate ownerId
    const owner = await UserModel.findById(ownerId).lean();
    if (!owner) {
      return NextResponse.json({ message: 'Owner user not found' }, { status: 404 });
    }

    // Check for existing identity username (case-insensitive for username)
    const existingIdentity = await IdentityModel.findOne({ username: new RegExp(`^${username}$`, 'i') });
    if (existingIdentity) {
      return NextResponse.json({ message: 'Identity username already taken' }, { status: 409 });
    }
    
    // Check if a user already has this username
    const existingUserWithUsername = await UserModel.findOne({ username: new RegExp(`^${username}$`, 'i') });
    if (existingUserWithUsername) {
         return NextResponse.json({ message: 'This username is already taken by a user account.' }, { status: 409 });
    }


    const newIdentityData: Partial<IdentityType> & { owner: string } = {
      username,
      owner: ownerId, // Store owner as ObjectId string
      isIdentity: true, // Explicitly set
      followers: [],
      following: [],
      followerModel: 'Identity',
      followingModel: 'Identity'
    };

    if (displayName) newIdentityData.displayName = displayName;
    if (email) newIdentityData.email = email;
    if (bio) newIdentityData.bio = bio;
    if (profilePictureUrl) newIdentityData.profilePictureUrl = profilePictureUrl;
    if (bannerImageUrl) newIdentityData.bannerImageUrl = bannerImageUrl;
    
    // teamMembers and socialLinks will be empty by default from schema

    const identity = new IdentityModel(newIdentityData);
    const savedIdentity = await identity.save();

    // The .save() pre-hook in IdentityModel handles default displayName and images if not provided
    const identityToReturn = savedIdentity.toJSON();
    return NextResponse.json(identityToReturn, { status: 201 });

  } catch (error: any) {
    console.error('Create Identity API error:', error);
    if (error.code === 11000) { 
      return NextResponse.json({ message: 'This username is already taken.' }, { status: 409 });
    }
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((val: any) => val.message);
        return NextResponse.json({ message: 'Validation Error', errors: messages }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
