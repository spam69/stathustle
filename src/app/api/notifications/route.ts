
import { NextResponse } from 'next/server';
import { mockNotifications, mockAdminUser } from '@/lib/mock-data';
import type { Notification } from '@/types';

const DEFAULT_NOTIFICATIONS_LIMIT = 5; // Default items per page for this API

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_NOTIFICATIONS_LIMIT), 10);

    // In a real app, get userId from session
    const userId = mockAdminUser.id; 

    const allUserNotifications = mockNotifications
      .filter(n => n.recipientUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const totalItems = allUserNotifications.length;
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedNotifications = allUserNotifications.slice(startIndex, endIndex);
    
    const hasMore = endIndex < totalItems;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return NextResponse.json({
      items: paginatedNotifications,
      hasMore,
      currentPage: page,
      totalItems, // Total count of notifications for this user
      totalPages: Math.ceil(totalItems / limit),
    });

  } catch (error) {
    console.error('Get Notifications API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}

    