import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';
import NotificationModel from '@/models/Notification.model';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { followerId, followerModel, followingId, followingModel, action } = await request.json();

    if (!followerId || !followerModel || !followingId || !followingModel || !action) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (!['follow', 'unfollow'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    // Get the follower document (User or Identity)
    const followerDoc = followerModel === 'User' 
      ? await UserModel.findById(followerId)
      : await IdentityModel.findById(followerId);

    if (!followerDoc) {
      return NextResponse.json({ message: 'Follower not found' }, { status: 404 });
    }

    // Get the following document (User or Identity)
    const followingDoc = followingModel === 'User'
      ? await UserModel.findById(followingId)
      : await IdentityModel.findById(followingId);

    if (!followingDoc) {
      return NextResponse.json({ message: 'User/Identity to follow not found' }, { status: 404 });
    }

    // Prevent self-following
    if (followerId === followingId && followerModel === followingModel) {
      return NextResponse.json({ message: 'Cannot follow yourself' }, { status: 400 });
    }

    if (action === 'follow') {
      // Add to following array if not already following
      if (!followerDoc.following?.includes(followingId)) {
        await followerDoc.updateOne({
          $push: { following: followingId }
        });
      }

      // Add to followers array if not already a follower
      if (!followingDoc.followers?.includes(followerId)) {
        await followingDoc.updateOne({
          $push: { followers: followerId }
        });

        // Create notification for new follower
        await NotificationModel.create({
          type: 'new_follower',
          actor: followerId,
          actorModel: followerModel,
          recipientId: followingId,
          recipientModel: followingModel,
          message: `${followerDoc.username} started following you`,
          link: `/${followerModel.toLowerCase()}/${followerDoc.username}`,
          isRead: false
        });
      }
    } else if (action === 'unfollow') {
      // Remove from following array
      await followerDoc.updateOne({
        $pull: { following: followingId }
      });

      // Remove from followers array
      await followingDoc.updateOne({
        $pull: { followers: followerId }
      });
    }

    return NextResponse.json({ message: `Successfully ${action}ed` });

  } catch (error: any) {
    console.error('Error in follow/unfollow action:', error);
    return NextResponse.json({ message: 'An error occurred', error: error.message }, { status: 500 });
  }
} 