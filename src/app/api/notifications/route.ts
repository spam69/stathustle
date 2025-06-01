
import { NextResponse } from 'next/server';
import { mockNotifications, mockAdminUser } from '@/lib/mock-data';

export async function GET(request: Request) {
  try {
    // In a real app, get userId from session
    const userId = mockAdminUser.id; 

    const userNotifications = mockNotifications
      .filter(n => n.recipientUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return NextResponse.json(userNotifications);
  } catch (error) {
    console.error('Get Notifications API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
