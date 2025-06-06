
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';

export async function GET(
  request: Request,
  context: { params: { username: string } }
) {
  await dbConnect();
  try {
    const username = context.params.username;
    
    // Case-insensitive search for username
    const usernameRegex = new RegExp(`^${username}$`, 'i');

    let profile = await UserModel.findOne({ username: usernameRegex }).lean();
    
    if (!profile) {
      profile = await IdentityModel.findOne({ username: usernameRegex }).populate('owner', 'username profilePictureUrl').lean();
    }

    if (profile) {
      // Transform _id to id and remove __v for consistency with frontend types
      const transformedProfile = { ...profile, id: profile._id.toString() };
      delete (transformedProfile as any)._id;
      delete (transformedProfile as any).__v;
      if ((transformedProfile as any).owner && (transformedProfile as any).owner._id) {
        (transformedProfile as any).owner.id = (transformedProfile as any).owner._id.toString();
        delete (transformedProfile as any).owner._id;
      }
      if ((transformedProfile as any).teamMembers) {
        (transformedProfile as any).teamMembers = (transformedProfile as any).teamMembers.map((tm: any) => {
          if (tm.user && tm.user._id) {
            tm.user.id = tm.user._id.toString();
            delete tm.user._id;
          }
          return tm;
        });
      }

      return NextResponse.json(transformedProfile);
    } else {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }
  } catch (error: any) {
    const usernameForErrorLog = context && context.params ? context.params.username : "unknown_username";
    console.error(`Get Profile API error for ${usernameForErrorLog}:`, error);
    return NextResponse.json({ message: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
