import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import NotificationModel from '@/models/Notification.model';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { userId } = await request.json();
    console.log('Delete Read: Received userId:', userId);
    if (!userId) {
      return NextResponse.json({ message: 'No userId provided.' }, { status: 400 });
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const query = { recipientId: userObjectId, isRead: true };
    const result = await NotificationModel.deleteMany(query);
    const deletedCount = result.deletedCount || 0;
    return NextResponse.json({ message: `${deletedCount} read notification(s) deleted.` });
  } catch (error) {
    console.error('Delete Read Notifications API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
