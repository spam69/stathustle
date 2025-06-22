import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const isAuthorized = req.headers.get('x-authorized') === 'true';
    // Optionally, get user id from a header if you want to exclude self
    const userId = req.headers.get('x-user-id');

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');
    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Search users
    const userQuery = [
      {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      }
    ];
    if (isAuthorized && userId) {
      userQuery.push({ _id: { $ne: userId } });
    }
    const users = await UserModel.find({ $and: userQuery } as any)
      .limit(10)
      .lean();

    // Search identities
    const identityQuery = [
      {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { displayName: { $regex: query, $options: 'i' } }
        ]
      }
    ];
    if (isAuthorized && userId) {
      identityQuery.push({ owner: { $ne: userId } });
    }
    const identities = await IdentityModel.find({ $and: identityQuery } as any)
      .limit(10)
      .lean();

    // Format results
    const userResults = users.map(u => ({
      id: u._id,
      username: u.username,
      email: u.email,
      avatar: u.profilePictureUrl,
      isOnline: false // TODO: Add real online status
    }));
    const identityResults = identities.map(i => ({
      id: i._id,
      username: i.username,
      email: i.email,
      avatar: i.profilePictureUrl,
      isOnline: false // TODO: Add real online status
    }));

    return NextResponse.json([...userResults, ...identityResults]);
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
} 