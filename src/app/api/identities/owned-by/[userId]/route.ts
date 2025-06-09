
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import IdentityModel, { IIdentitySchema } from '@/models/Identity.model';
import UserModel, { IUserSchema } from '@/models/User.model'; // To populate owner details if needed
import type { Identity as IdentityType, User as UserType } from '@/types';

// Helper to transform identity documents for client consumption
const transformIdentityForClient = (identityDoc: IIdentitySchema): IdentityType => {
  const owner = identityDoc.owner as IUserSchema; // Assuming owner is populated or we only need ID
  return {
    id: identityDoc._id.toString(),
    username: identityDoc.username,
    displayName: identityDoc.displayName,
    email: identityDoc.email,
    profilePictureUrl: identityDoc.profilePictureUrl,
    bannerImageUrl: identityDoc.bannerImageUrl,
    socialLinks: identityDoc.socialLinks?.map(sl => ({ platform: sl.platform, url: sl.url })),
    bio: identityDoc.bio,
    owner: { // Provide a minimal UserType structure for the owner
      id: owner?._id?.toString() || (typeof identityDoc.owner === 'string' ? identityDoc.owner : 'unknown_owner_id'),
      username: owner?.username || 'UnknownOwner',
      // Add other essential User fields if your IdentityType expects more for the owner
      // For example, if profilePictureUrl is needed:
      // profilePictureUrl: owner?.profilePictureUrl, 
      isIdentity: false, // Owner is always a User
    },
    teamMembers: identityDoc.teamMembers?.map(tm => ({
      user: { // Provide minimal UserType for team members
        id: (tm.user as IUserSchema)?._id?.toString() || (typeof tm.user === 'string' ? tm.user : 'unknown_team_member_id'),
        username: (tm.user as IUserSchema)?.username || 'UnknownTeamMember',
        isIdentity: false,
      },
      permissions: tm.permissions,
    })),
    isIdentity: true,
    themePreference: identityDoc.themePreference,
  };
};


export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  await dbConnect();
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // Find identities owned by the user and populate basic owner info
    // If you need more owner details, adjust the populate fields
    const ownedIdentities = await IdentityModel.find({ owner: userId })
      .populate({
        path: 'owner',
        select: 'username _id profilePictureUrl' // Select only necessary fields for the owner object in IdentityType
      })
      .lean();

    if (!ownedIdentities) {
      return NextResponse.json([], { status: 200 }); // Return empty array if no identities found
    }

    const transformedIdentities = ownedIdentities.map(identityDoc => transformIdentityForClient(identityDoc as IIdentitySchema));

    return NextResponse.json(transformedIdentities);

  } catch (error: any) {
    console.error(`Error fetching identities for user ${params.userId}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred', error: error.message }, { status: 500 });
  }
}
