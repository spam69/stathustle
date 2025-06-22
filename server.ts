import 'dotenv/config'; // Load environment variables
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import MessageModel, { IMessageSchema } from '@/models/Message.model';
import ConversationModel from '@/models/Conversation.model';

const onlineUsers = new Set<string>();

// A more specific User type for what verifyAuth returns
interface AuthenticatedUser {
    id: string;
    username: string;
    // Add other fields if they exist, or keep it minimal
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.ORIGIN;

interface SocketWithUser extends Socket {
    data: {
        user: AuthenticatedUser;
    };
}

app.prepare().then(() => {
  const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: '/api/ws',
    cors: {
      origin: ORIGIN,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  console.log('[WebSocket] Server initialized');

  // Socket.IO authentication middleware
  io.use(async (socket: Socket, next) => {
    console.log('[WebSocket] New connection attempt. Verifying authentication...');
    const { userId } = socket.handshake.auth;

    if (userId) {
      console.log(`[WebSocket] Auth attempt with userId: ${userId}`);
      // In a real app, you would verify this userId against a session or database.
      // For now, we'll assume it's valid if present.
      (socket as SocketWithUser).data.user = { id: userId, username: 'user' };
      console.log(`[WebSocket] Authentication successful for userId: ${userId}`);
      return next();
    }
    
    console.log('[WebSocket] Authentication failed: No userId provided in auth payload.');
    return next(new Error('Unauthorized: No userId provided'));
  });

  io.on('connection', (socket: Socket) => {
    const { user } = (socket as SocketWithUser).data;
    const userId = user.id;

    console.log(`[WebSocket] User connected: ${userId} (Socket ID: ${socket.id})`);
    socket.join(userId);
    onlineUsers.add(userId);
    
    // Broadcast to all clients that this user is now online
    io.emit('user-online', userId);
    
    // Send the current list of online users to the newly connected client
    socket.emit('online-users', Array.from(onlineUsers));

    console.log(`[WebSocket] User ${userId} joined room: ${userId}`);
    console.log('[WebSocket] Online users:', Array.from(onlineUsers));

    socket.on('message', async (message) => {
        console.log(`[WebSocket] Received message from ${userId}:`, message);
        try {
            await dbConnect();
            const { receiverId, clientMessageId, ...restOfMessage } = message;

            if (!receiverId) {
                console.error('[WebSocket] Error: receiverId is missing');
                return;
            }

            // Manually validate content for text messages
            if (message.type === 'text' && (!message.content || message.content.trim() === '')) {
              console.error('[WebSocket] Error: Content is required for text messages.');
              // Optionally, you could emit an error back to the client here.
              return;
            }

            console.log(`[WebSocket] Processing message from ${userId} to ${receiverId}`);

            // Ensure conversation exists
            let conversation = await ConversationModel.findOne({
                participants: { $all: [userId, receiverId], $size: 2 }
            });

            if (!conversation) {
                console.log(`[WebSocket] Creating new conversation between ${userId} and ${receiverId}`);
                conversation = await ConversationModel.create({
                    participants: [userId, receiverId],
                    unreadCounts: { [userId]: 0, [receiverId]: 1 }
                });
            } else {
                console.log(`[WebSocket] Found existing conversation: ${conversation._id}`);
                conversation.unreadCounts = conversation.unreadCounts || {};
                conversation.unreadCounts[receiverId] = (conversation.unreadCounts[receiverId] || 0) + 1;
            }

            // Save the message - Fix field names to match schema
            const savedMessageDoc = await MessageModel.create({
                ...restOfMessage,
                conversationId: conversation._id,
                sender: userId,  // Changed from senderId to sender
                receiver: receiverId,  // Changed from receiverId to receiver
                read: false
            });

            console.log(`[WebSocket] Message saved to database: ${savedMessageDoc._id}`);

            conversation.lastMessage = savedMessageDoc._id as mongoose.Types.ObjectId;
            await conversation.save();

            console.log(`[WebSocket] Emitting message to rooms: ${userId} and ${receiverId}`);

            // Manually construct the message to match the client-side Message type
            const messageToEmit = {
              id: savedMessageDoc._id.toString(),
              content: savedMessageDoc.content,
              type: savedMessageDoc.type,
              senderId: savedMessageDoc.sender.toString(),
              receiverId: savedMessageDoc.receiver.toString(),
              conversationId: savedMessageDoc.conversationId.toString(),
              createdAt: savedMessageDoc.createdAt,
              read: savedMessageDoc.read,
              fileUrl: savedMessageDoc.fileUrl,
              fileName: savedMessageDoc.fileName,
              fileType: savedMessageDoc.fileType,
              fileSize: savedMessageDoc.fileSize,
              clientMessageId,
            };

            // Emit to both sender and receiver
            io.to(userId).emit('message', messageToEmit);
            io.to(receiverId).emit('message', messageToEmit);

            console.log(`[WebSocket] Message from ${userId} to ${receiverId} saved and emitted successfully.`);

        } catch (error) {
            console.error('[WebSocket] Error handling message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[WebSocket] User disconnected: ${userId} (Socket ID: ${socket.id})`);
        socket.leave(userId);
        onlineUsers.delete(userId);
        
        // Broadcast to all clients that this user is now offline
        io.emit('user-offline', userId);
        
        console.log('[WebSocket] Online users:', Array.from(onlineUsers));
    });

    // Add error handling
    socket.on('error', (error) => {
        console.error(`[WebSocket] Socket error for user ${userId}:`, error);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`[WebSocket] WebSocket server ready on path: /api/ws`);
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('[Server] Shutting down gracefully...');
    io.close(() => {
      console.log('[WebSocket] Server closed.');
      httpServer.close(() => {
        console.log('[HTTP] Server closed.');
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}); 