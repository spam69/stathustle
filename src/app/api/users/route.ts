
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel, { IUserSchema } from '@/models/User.model';
import IdentityModel, { IIdentitySchema } from '@/models/Identity.model';
import type { User as UserType, Identity as IdentityType } from '@/types';

// Helper to transform user/identity documents
const transformProfile = (doc: IUserSchema | IIdentitySchema, isIdentity: boolean): UserType | IdentityType => {
  const base = {
    id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    profilePictureUrl: doc.profilePictureUrl,
    bannerImageUrl: doc.bannerImageUrl,
    socialLinks: doc.socialLinks?.map(sl => ({ platform: sl.platform, url: sl.url })), // Ensure sub-documents are plain objects
    bio: doc.bio,
    themePreference: doc.themePreference,
    isIdentity: isIdentity,
  };

  if (isIdentity) {
    const identityDoc = doc as IIdentitySchema;
    return {
      ...base,
      displayName: identityDoc.displayName,
      // Owner and teamMembers might need more careful population/transformation if used directly
      // For now, focusing on fields used in RightSidebar
      owner: identityDoc.owner ? { id: identityDoc.owner._id.toString(), username: (identityDoc.owner as IUserSchema)?.username || 'Unknown' } as UserType : undefined as unknown as UserType, // Simplified owner
    } as IdentityType;
  }
  return base as UserType;
};


export async function GET() {
  await dbConnect();
  try {
    const usersFromDB = await UserModel.find({ isIdentity: { $ne: true } }).lean(); // Find only actual users
    const identitiesFromDB = await IdentityModel.find({}).lean(); // Find identities

    const transformedUsers: UserType[] = usersFromDB.map(userDoc => transformProfile(userDoc as IUserSchema, false) as UserType);
    const transformedIdentities: IdentityType[] = identitiesFromDB.map(identityDoc => transformProfile(identityDoc as IIdentitySchema, true) as IdentityType);
    
    const allProfiles: (UserType | IdentityType)[] = [...transformedUsers, ...transformedIdentities];

    return NextResponse.json(allProfiles);
  } catch (error: any) {
    console.error('API Error fetching users/identities:', error);
    return NextResponse.json({ message: 'Failed to fetch users and identities', error: error.message }, { status: 500 });
  }
}
