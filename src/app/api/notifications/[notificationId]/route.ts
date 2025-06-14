import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import NotificationModel from '@/models/Notification.model';
import mongoose from 'mongoose';

export async function DELETE(
  request: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    await dbConnect();
    const { notificationId } = params;
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json({ message: 'Invalid notification ID' }, { status: 400 });
    }
    const deleted = await NotificationModel.findByIdAndDelete(notificationId);
    if (!deleted) {
      return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
    }
    return NextResponse.json({ message: `Notification ${notificationId} deleted successfully.` });
  } catch (error) {
    console.error(`Delete Notification API error for ${params.notificationId}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
