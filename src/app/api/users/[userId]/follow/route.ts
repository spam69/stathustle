import { NextResponse } from 'next/server';
import { mockUsers, mockAdminUser } from '@/lib/mock-data';
import { createNotification } from '@/lib/notifications';
import type { User } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: followedUserId } = await params;
    
    // In a real app, the follower would come from the authenticated session.
    // For this mock, let's assume mockAdminUser is the one performing the follow action.
    const followerUser = mockAdminUser; 

    if (!followerUser) {
      return NextResponse.json({ message: 'Follower user (mockAdminUser) not found' }, { status: 404 });
    }

    const userToFollow = mockUsers.find(u => u.id === followedUserId);
    if (!userToFollow) {
      // Could also check mockIdentities if you want to follow identities
      return NextResponse.json({ message: 'User to follow not found' }, { status: 404 });
    }

    if (followerUser.id === followedUserId) {
      return NextResponse.json({ message: 'Cannot follow yourself' }, { status: 400 });
    }

    // Simulate "follow" action (in a real app, this would update database records)
    console.log(`[API/Follow] User ${followerUser.username} (ID: ${followerUser.id}) is now following ${userToFollow.username} (ID: ${userToFollow.id})`);

    // Create a notification for the user who was followed
    createNotification('new_follower', followerUser, userToFollow.id);

    return NextResponse.json({ message: `Successfully followed ${userToFollow.username}` });

  } catch (error) {
    console.error(`Follow User API error for userId ${params.userId}:`, error);
    return NextResponse.json({ message: 'An unexpected error occurred during follow action' }, { status: 500 });
  }
}