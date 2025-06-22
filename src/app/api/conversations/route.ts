import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ConversationModel from '@/models/Conversation.model';
import MessageModel from '@/models/Message.model';
import UserModel from '@/models/User.model';
import IdentityModel from '@/models/Identity.model';

async function getParticipantInfo(participantId: string) {
    // Try finding a user first
    let participant = await UserModel.findById(participantId).lean();
    if (participant) {
        return {
            id: participant._id.toString(),
            username: participant.username,
            displayName: participant.username,
            avatar: participant.profilePictureUrl,
            isIdentity: false
        };
    }
    // If not a user, try finding an identity
    participant = await IdentityModel.findById(participantId).lean();
    if (participant) {
        return {
            id: participant._id.toString(),
            username: participant.username,
            displayName: participant.displayName || participant.username,
            avatar: participant.profilePictureUrl,
            isIdentity: true
        };
    }
    return null;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const isAuthorized = req.headers.get('x-authorized') === 'true';
    const userId = req.headers.get('x-user-id');
    console.log('GET /api/conversations x-authorized:', req.headers.get('x-authorized'));
    console.log('GET /api/conversations x-user-id:', req.headers.get('x-user-id'));
    if (!isAuthorized || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Find conversations where user is a participant
    const conversationDocs = await ConversationModel.find({
      participants: userId
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'lastMessage',
        model: MessageModel
      });

    const conversations = conversationDocs.map(doc => doc.toObject());

    // Get total count for pagination
    const total = await ConversationModel.countDocuments({
      participants: userId
    });

    // Populate participant info (other than self)
    for (const conv of conversations) {
      const otherId = conv.participants.find((id: any) => id.toString() !== userId);
      if (otherId) {
        const otherParticipantInfo = await getParticipantInfo(otherId.toString());
        if (otherParticipantInfo) {
            conv.participant = {
              id: otherParticipantInfo.id,
              username: otherParticipantInfo.username,
              displayName: otherParticipantInfo.displayName,
              avatar: otherParticipantInfo.avatar,
              isOnline: false // TODO: Add online status logic
            };
        }
      }
      conv.unreadCount = conv.unreadCounts?.[userId] || 0;
    }

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const isAuthorized = req.headers.get('x-authorized') === 'true';
    const userId = req.headers.get('x-user-id');
    console.log('POST /api/conversations x-authorized:', req.headers.get('x-authorized'));
    console.log('POST /api/conversations x-user-id:', req.headers.get('x-user-id'));
    if (!isAuthorized || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participantId } = await req.json();
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID required' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    let conversation = await ConversationModel.findOne({
      participants: { $all: [userId, participantId], $size: 2 }
    });

    if (conversation) {
      // Enrich with participant info
      const otherId = conversation.participants.find((id) => id.toString() !== userId);
      if (otherId) {
        const otherParticipantInfo = await getParticipantInfo(otherId.toString());
        if (otherParticipantInfo) {
            conversation = conversation.toObject();
            conversation.participant = {
              id: otherParticipantInfo.id,
              username: otherParticipantInfo.username,
              displayName: otherParticipantInfo.displayName,
              avatar: otherParticipantInfo.avatar,
              isOnline: false // TODO: Add online status logic
            };
        }
      }
      conversation.unreadCount = conversation.unreadCounts?.[userId] || 0;
      return NextResponse.json(conversation);
    }

    // Create new conversation (optimistic)
    conversation = await ConversationModel.create({
      participants: [userId, participantId],
      unreadCounts: { [participantId]: 0, [userId]: 0 }
    });

    // Enrich with participant info for new conversation
    const otherId = participantId;
    const otherParticipantInfo = await getParticipantInfo(otherId);
    if (otherParticipantInfo) {
        conversation = conversation.toObject();
        conversation.participant = {
            id: otherParticipantInfo.id,
            username: otherParticipantInfo.username,
            displayName: otherParticipantInfo.displayName,
            avatar: otherParticipantInfo.avatar,
            isOnline: false // TODO: Add online status logic
        };
    }
    conversation.unreadCount = 0;
    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
} 