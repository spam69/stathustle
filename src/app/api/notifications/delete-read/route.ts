import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import NotificationModel from '@/models/Notification.model';
import UserModel from '@/models/User.model';

export async function POST(request: Request) {
  try {
    await dbConnect();
    // For demo, use the first user in the database
    const user = await UserModel.findOne();
    if (!user) {
      return NextResponse.json({ message: 'No user found in database.' }, { status: 404 });
    }
    const userId = user._id;
    const result = await NotificationModel.deleteMany({ recipientUserId: userId, isRead: true });
    const deletedCount = result.deletedCount || 0;
    return NextResponse.json({ message: `${deletedCount} read notification(s) deleted.` });
  } catch (error) {
    console.error('Delete Read Notifications API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
