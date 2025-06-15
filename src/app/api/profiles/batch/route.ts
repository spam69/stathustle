import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';

export async function GET(request: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',') || [];

    if (!ids.length) {
      return NextResponse.json({ message: 'No IDs provided' }, { status: 400 });
    }

    // Fetch both users and identities
    const [users, identities] = await Promise.all([
      UserModel.find({ _id: { $in: ids } })
        .select('+followers +following')
        .lean(),
      IdentityModel.find({ _id: { $in: ids } })
        .select('+followers +following')
        .populate('owner', 'username profilePictureUrl')
        .lean()
    ]);

    // Combine and transform the results
    const profiles = [...users, ...identities].map(profile => {
      const transformedProfile = { ...profile, id: profile._id.toString() };
      delete (transformedProfile as any)._id;
      delete (transformedProfile as any).__v;

      // Transform followers and following arrays
      if (transformedProfile.followers) {
        transformedProfile.followers = transformedProfile.followers.map((f: any) => f.toString());
      }
      if (transformedProfile.following) {
        transformedProfile.following = transformedProfile.following.map((f: any) => f.toString());
      }

      if ((transformedProfile as any).owner && (transformedProfile as any).owner._id) {
        (transformedProfile as any).owner.id = (transformedProfile as any).owner._id.toString();
        delete (transformedProfile as any).owner._id;
      }

      return transformedProfile;
    });

    return NextResponse.json(profiles);
  } catch (error: any) {
    console.error('Error in batch profiles API:', error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 