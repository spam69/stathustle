import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MessageModel from '@/models/Message.model';
import ConversationModel from '@/models/Conversation.model';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Use the same auth pattern as other APIs
    const isAuthorized = req.headers.get('x-authorized') === 'true';
    const userId = req.headers.get('x-user-id');
    
    console.log('[Messages API] Auth headers:', {
      'x-authorized': req.headers.get('x-authorized'),
      'x-user-id': req.headers.get('x-user-id')
    });
    
    if (!isAuthorized || !userId) {
      console.log('[Messages API] Authentication failed - missing headers');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    const before = searchParams.get('before');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID required' },
        { status: 400 }
      );
    }

    console.log('[Messages API] Fetching messages for conversation:', conversationId);
    console.log('[Messages API] User ID:', userId);

    // Verify user is part of the conversation
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      console.log('[Messages API] Conversation not found or user not participant');
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages with pagination
    const query: any = { conversationId };
    if (before) {
      query._id = { $lt: before };
    }
    const messages = await MessageModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log('[Messages API] Found messages:', messages.length);

    // Manually transform messages to include senderId and receiverId
    const transformedMessages = messages.map(msg => ({
      ...msg,
      id: msg._id.toString(),
      senderId: msg.sender.toString(),
      receiverId: msg.receiver.toString(),
    }));

    // Mark messages as read for the user - Fix field name to match schema
    await MessageModel.updateMany(
      {
        conversationId,
        receiver: userId,  // Using 'receiver' as per Message model schema
        read: false
      },
      { $set: { read: true } }
    );

    // Update unreadCounts in conversation
    conversation.unreadCounts[userId] = 0;
    await conversation.save();

    return NextResponse.json(transformedMessages);
  } catch (error) {
    console.error('[Messages API] Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
} 