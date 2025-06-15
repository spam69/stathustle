import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import NotificationModel from '@/models/Notification.model';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { notificationId, userId } = await request.json();
    console.log('Backend: Marking as read', { notificationId, userId });

    if (!userId) {
      return NextResponse.json({ message: 'No userId provided.' }, { status: 400 });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    let updatedCount = 0;
    if (notificationId && typeof notificationId === 'string' && notificationId.trim() !== '') {
      // Mark only one as read
      const result = await NotificationModel.updateOne(
        { _id: notificationId, recipientId: userObjectId },
        { $set: { isRead: true } }
      );
      updatedCount = result.modifiedCount;
    } else {
      // Mark all as read
      const result = await NotificationModel.updateMany(
        { recipientId: userObjectId, isRead: false },
        { $set: { isRead: true } }
      );
      updatedCount = result.modifiedCount;
    }
    return NextResponse.json({ message: `${updatedCount} notification(s) marked as read.` });
  } catch (error) {
    console.error('Mark Notifications Read API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
