import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import IdentityModel, { IIdentitySchema } from '@/models/Identity.model';
import UserModel from '@/models/User.model';
import type { Identity as IdentityType } from '@/types';

const transformIdentityForClient = (identityDoc: IIdentitySchema): IdentityType => {
  const owner = identityDoc.owner as any;
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
      const tmUser = tm.user as any;
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

export async function POST(request: Request, { params }: { params: { identityId: string } }) {
  await dbConnect();
  try {
    const { identityId } = await params;
    const { identifier } = await request.json();
    if (!identifier) {
      return NextResponse.json({ message: 'Username or email is required' }, { status: 400 });
    }
    // Lookup user by username (case-insensitive)
    const usernameRegex = new RegExp(`^${identifier}$`, 'i');
    const user = await UserModel.findOne({ username: usernameRegex });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    // Find identity
    const identity = await IdentityModel.findById(identityId);
    if (!identity) {
      return NextResponse.json({ message: 'Identity not found' }, { status: 404 });
    }
    // Check if already a team member
    const alreadyMember = identity.teamMembers?.some(tm => tm.user.toString() === user._id.toString());
    if (alreadyMember) {
      return NextResponse.json({ message: 'User is already a team member' }, { status: 400 });
    }
    // Add to teamMembers
    identity.teamMembers = identity.teamMembers || [];
    identity.teamMembers.push({ user: user._id, permissions: [] });
    await identity.save();
    // Populate and return updated identity
    const updated = await IdentityModel.findById(identityId)
      .populate({ path: 'owner', select: 'username _id profilePictureUrl email' })
      .populate({ path: 'teamMembers.user', select: 'username _id profilePictureUrl email' });
    return NextResponse.json(transformIdentityForClient(updated as IIdentitySchema));
  } catch (error: any) {
    console.error('Add team member error:', error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { identityId: string } }) {
  await dbConnect();
  try {
    const { identityId } = await params;
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }
    const identity = await IdentityModel.findById(identityId);
    if (!identity) {
      return NextResponse.json({ message: 'Identity not found' }, { status: 404 });
    }
    identity.teamMembers = (identity.teamMembers || []).filter(tm => tm.user.toString() !== userId);
    await identity.save();
    // Populate and return updated identity
    const updated = await IdentityModel.findById(identityId)
      .populate({ path: 'owner', select: 'username _id profilePictureUrl email' })
      .populate({ path: 'teamMembers.user', select: 'username _id profilePictureUrl email' });
    return NextResponse.json(transformIdentityForClient(updated as IIdentitySchema));
  } catch (error: any) {
    console.error('Remove team member error:', error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 