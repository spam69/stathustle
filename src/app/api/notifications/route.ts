
import { NextResponse } from 'next/server';
import { mockNotifications, mockAdminUser } from '@/lib/mock-data';
import type { Notification } from '@/types';

const DEFAULT_NOTIFICATIONS_LIMIT = 5; // Default items per page for this API

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_NOTIFICATIONS_LIMIT), 10);

    const userId = mockAdminUser.id; 
    // console.log(`[API/NOTIFICATIONS] Request for page ${page}, limit ${limit} for userId: ${userId}`);
    // console.log(`[API/NOTIFICATIONS] Total mockNotifications available in mock-data: ${mockNotifications.length}`);


    const allUserNotifications = mockNotifications
      .filter(n => n.recipientUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // console.log(`[API/NOTIFICATIONS] Filtered ${allUserNotifications.length} notifications for user ${userId}`);

    const totalItems = allUserNotifications.length;
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedNotifications = allUserNotifications.slice(startIndex, endIndex);
    
    const hasMore = endIndex < totalItems;

    // console.log(`[API/NOTIFICATIONS] Returning ${paginatedNotifications.length} items. Total: ${totalItems}, HasMore: ${hasMore}`);

    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay

    return NextResponse.json({
      items: paginatedNotifications,
      hasMore,
      currentPage: page,
      totalItems, 
      totalPages: Math.ceil(totalItems / limit),
    });

  } catch (error) {
    console.error('Get Notifications API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred' }, { status: 500 });
  }
}
