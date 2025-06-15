import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import IdentityModel, { IIdentitySchema } from '@/models/Identity.model';
import UserModel, { IUserSchema } from '@/models/User.model';
import type { Identity as IdentityType, User as UserType } from '@/types';

// Helper to transform identity documents for client consumption
const transformIdentityForClient = (identityDoc: IIdentitySchema): IdentityType => {
  const owner = identityDoc.owner as IUserSchema;
  return {
    id: identityDoc._id.toString(),
    username: identityDoc.username,
    displayName: identityDoc.displayName,
    email: identityDoc.email,
    profilePictureUrl: identityDoc.profilePictureUrl,
    bannerImageUrl: identityDoc.bannerImageUrl,
    socialLinks: identityDoc.socialLinks?.map(sl => ({ platform: sl.platform, url: sl.url })),
    bio: identityDoc.bio,
    owner: {
      id: owner?._id?.toString() || (typeof identityDoc.owner === 'string' ? identityDoc.owner : 'unknown_owner_id'),
      username: owner?.username || 'UnknownOwner',
      profilePictureUrl: owner?.profilePictureUrl || '',
      isIdentity: false,
    },
    teamMembers: identityDoc.teamMembers?.map(tm => {
      const tmUser = tm.user as IUserSchema;
      return {
        user: {
          id: tmUser?._id?.toString() || (typeof tm.user === 'string' ? tm.user : 'unknown_team_member_id'),
          username: tmUser?.username || 'UnknownTeamMember',
          profilePictureUrl: tmUser?.profilePictureUrl || '',
          email: tmUser?.email || '',
          isIdentity: false,
          _id: tmUser?._id?.toString() || undefined,
        },
        permissions: tm.permissions,
      };
    }),
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
    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }
    // Find identities where user is a team member
    const identities = await IdentityModel.find({ 'teamMembers.user': userId })
      .populate({
        path: 'owner',
        select: 'username _id profilePictureUrl'
      })
      .populate({
        path: 'teamMembers.user',
        select: 'username _id profilePictureUrl'
      })
      .lean();
    if (!identities) {
      return NextResponse.json([], { status: 200 });
    }
    const transformedIdentities = identities.map(identityDoc => transformIdentityForClient(identityDoc as IIdentitySchema));
    return NextResponse.json(transformedIdentities);
  } catch (error: any) {
    console.error(`Error fetching team member identities for user ${params.userId}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred', error: error.message }, { status: 500 });
  }
} 