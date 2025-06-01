
import { NextResponse } from 'next/server';
import { mockNotifications, mockAdminUser } from '@/lib/mock-data';

export async function POST(request: Request) {
  try {
    // In a real app, get userId from session
    const userId = mockAdminUser.id; 

    const initialLength = mockNotifications.length;
    // Filter out read notifications for the current user
    const notificationsToKeep = mockNotifications.filter(
      n => !(n.recipientUserId === userId && n.isRead)
    );
    
    const deletedCount = mockNotifications.length - notificationsToKeep.length;
    
    // Replace the original array with the filtered one
    mockNotifications.length = 0; // Clear original array
    mockNotifications.push(...notificationsToKeep); // Add back only unread or others' notifications

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({ message: `${deletedCount} read notification(s) deleted.` });
  } catch (error) {
    console.error('Delete Read Notifications API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
