import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import NotificationModel from '@/models/Notification.model';
import UserModel from '@/models/User.model';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { notificationId } = (await request.json().catch(() => ({}))) as { notificationId?: string };
    // For demo, use the first user in the database
    const user = await UserModel.findOne();
    if (!user) {
      return NextResponse.json({ message: 'No user found in database.' }, { status: 404 });
    }
    const userId = user._id;

    let updatedCount = 0;
    if (notificationId) {
      const result = await NotificationModel.updateOne({ _id: notificationId, recipientUserId: userId }, { $set: { isRead: true } });
      updatedCount = result.modifiedCount;
    } else {
      const result = await NotificationModel.updateMany({ recipientUserId: userId, isRead: false }, { $set: { isRead: true } });
      updatedCount = result.modifiedCount;
    }
    return NextResponse.json({ message: `${updatedCount} notification(s) marked as read.` });
  } catch (error) {
    console.error('Mark Notifications Read API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
