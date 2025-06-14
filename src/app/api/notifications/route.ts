import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import NotificationModel from '@/models/Notification.model';
import UserModel from '@/models/User.model';

const DEFAULT_NOTIFICATIONS_LIMIT = 5; // Default items per page for this API

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_NOTIFICATIONS_LIMIT), 10);

    // Fetch a real user from the database (for demo, get the first user)
    const user = await UserModel.findOne();
    if (!user) {
      return NextResponse.json({ message: 'No user found in database.' }, { status: 404 });
    }
    const userId = user._id;

    // Query notifications for the user, sorted by createdAt descending
    const filter = { recipientUserId: userId };
    const totalItems = await NotificationModel.countDocuments(filter);
    const notifications = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const hasMore = page * limit < totalItems;

    return NextResponse.json({
      items: notifications,
      hasMore,
      currentPage: page,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    console.error('Get Notifications API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
