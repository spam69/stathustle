
import { NextResponse } from 'next/server';
import { mockNotifications } from '@/lib/mock-data';

export async function DELETE(
  request: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    const { notificationId } = params;
    // In a real app, ensure the notification belongs to the authenticated user before deleting
    // For mock, we assume it's for the admin user or any user for testing

    const initialLength = mockNotifications.length;
    const notificationIndex = mockNotifications.findIndex(n => n.id === notificationId);

    if (notificationIndex === -1) {
      return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
    }

    mockNotifications.splice(notificationIndex, 1);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    if (mockNotifications.length < initialLength) {
      return NextResponse.json({ message: `Notification ${notificationId} deleted successfully.` });
    } else {
      // Should not happen if splice worked and index was found
      return NextResponse.json({ message: `Failed to delete notification ${notificationId}.` }, { status: 500 });
    }

  } catch (error) {
    console.error(`Delete Notification API error for ${params.notificationId}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
