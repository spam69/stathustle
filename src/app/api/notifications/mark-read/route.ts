
import { NextResponse } from 'next/server';
import { mockNotifications, mockAdminUser } from '@/lib/mock-data';

export async function POST(request: Request) {
  try {
    // In a real app, get userId from session
    const userId = mockAdminUser.id;
    const { notificationId } = (await request.json().catch(() => ({}))) as { notificationId?: string };


    let updatedCount = 0;
    mockNotifications.forEach(n => {
      if (n.recipientUserId === userId && !n.isRead) {
        if (notificationId && n.id === notificationId) {
          n.isRead = true;
          updatedCount++;
        } else if (!notificationId) { // Mark all as read if no specific ID
          n.isRead = true;
          updatedCount++;
        }
      }
    });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({ message: `${updatedCount} notification(s) marked as read.` });
  } catch (error) {
    console.error('Mark Notifications Read API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
