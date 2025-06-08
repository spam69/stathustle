
// server.js
/* eslint-disable @typescript-eslint/no-var-requires */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); // For ObjectId
require('dotenv').config(); // To load .env variables

// Import Mongoose models. Ensure paths are correct.
// Adjust these paths if your models are structured differently or if dbConnect handles registration.
const dbConnect = require('./dist/src/lib/dbConnect').default; // Assuming build output in dist
const ChatMessageModel = require('./dist/src/models/ChatMessage.model').default;
const ChatConversationModel = require('./dist/src/models/ChatConversation.model').default;
const UserModel = require('./dist/src/models/User.model').default; // For fetching sender/receiver details
const IdentityModel = require('./dist/src/models/Identity.model').default;


const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = parseInt(process.env.PORT, 10) || 9002;

// Maps userId to an array of socketIds (a user can have multiple tabs/connections)
const userSockets = new Map();

app.prepare().then(async () => {
  await dbConnect(); // Ensure database is connected before starting server

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"]
    }
  });

  // Namespace for User-to-User Chat
  const userChatNamespace = io.of('/user-chat');

  userChatNamespace.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId || typeof userId !== 'string') {
      socket.disconnect();
      return;
    }

    console.log(`User ${userId} connected to /user-chat with socket ${socket.id}`);
    if (!userSockets.has(userId)) {
      userSockets.set(userId, []);
    }
    userSockets.get(userId).push(socket.id);
    socket.userId = userId; // Store userId on the socket instance

    socket.on('sendMessage', async (data) => {
      // data: { receiverId: string, content: string, clientTempId?: string }
      const { receiverId, content, clientTempId } = data;
      const senderId = socket.userId;

      if (!receiverId || !content || !senderId) {
        console.error('sendMessage: Missing data', data);
        socket.emit('messageError', { error: 'Missing data for sending message.', clientTempId });
        return;
      }

      try {
        // Determine senderModel (User or Identity)
        let senderDoc = await UserModel.findById(senderId).lean();
        let senderModel = 'User';
        if (!senderDoc) {
            senderDoc = await IdentityModel.findById(senderId).lean();
            senderModel = 'Identity';
        }
        if (!senderDoc) {
            throw new Error(`Sender with ID ${senderId} not found.`);
        }

        // Determine receiverModel
        let receiverDoc = await UserModel.findById(receiverId).lean();
        let receiverModel = 'User';
        if (!receiverDoc) {
            receiverDoc = await IdentityModel.findById(receiverId).lean();
            receiverModel = 'Identity';
        }
        if (!receiverDoc) {
            throw new Error(`Receiver with ID ${receiverId} not found.`);
        }

        // Find or create conversation
        let conversation = await ChatConversationModel.findOne({
          $and: [
            { 'participants.userRef': new mongoose.Types.ObjectId(senderId) },
            { 'participants.userRef': new mongoose.Types.ObjectId(receiverId) }
          ]
        });

        if (!conversation) {
          conversation = new ChatConversationModel({
            participants: [
              { userRef: new mongoose.Types.ObjectId(senderId), userModel: senderModel },
              { userRef: new mongoose.Types.ObjectId(receiverId), userModel: receiverModel }
            ]
          });
        }

        const chatMessage = new ChatMessageModel({
          conversationId: conversation._id,
          sender: new mongoose.Types.ObjectId(senderId),
          senderModel: senderModel,
          content: content,
          isRead: false // Mark as unread initially
        });

        await chatMessage.save();

        conversation.lastMessage = chatMessage._id;
        await conversation.save();

        const populatedMessage = await ChatMessageModel.findById(chatMessage._id)
            .populate({ path: 'sender', model: senderModel }) // Populate sender
            .lean();
        
        // Transform sender for client
        if (populatedMessage.sender && populatedMessage.sender._id) {
            populatedMessage.sender.id = populatedMessage.sender._id.toString();
        }


        const messageForClient = {
            ...populatedMessage,
            id: populatedMessage._id.toString(),
            clientTempId, // Include clientTempId if present
        };

        // Emit to receiver's sockets
        const receiverSocketIds = userSockets.get(receiverId);
        if (receiverSocketIds && receiverSocketIds.length > 0) {
          receiverSocketIds.forEach(socketId => {
            userChatNamespace.to(socketId).emit('newMessage', messageForClient);
          });
        }

        // Emit back to sender's sockets for confirmation and UI update
        const senderSocketIds = userSockets.get(senderId);
        if (senderSocketIds && senderSocketIds.length > 0) {
            senderSocketIds.forEach(socketId => {
                 userChatNamespace.to(socketId).emit('messageSent', messageForClient);
            });
        }


      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('messageError', { error: 'Failed to send message.', details: error.message, clientTempId });
      }
    });

    socket.on('markMessagesAsRead', async (data) => {
        // data: { conversationId: string, messageIds: string[] }
        const { conversationId, messageIds } = data;
        const currentUserId = socket.userId;

        if (!conversationId || !Array.isArray(messageIds) || messageIds.length === 0) {
            return;
        }
        try {
            await ChatMessageModel.updateMany(
                {
                    _id: { $in: messageIds.map(id => new mongoose.Types.ObjectId(id)) },
                    conversationId: new mongoose.Types.ObjectId(conversationId),
                    // Ensure only messages not sent by the current user are marked read by them
                    // sender: { $ne: new mongoose.Types.ObjectId(currentUserId) } // This logic is tricky if we want to mark own messages as "delivered" vs "read by other"
                },
                { $set: { isRead: true } }
            );
            // Notify other participant in conversation that messages were read
            const conversation = await ChatConversationModel.findById(conversationId).lean();
            if (conversation) {
                const otherParticipant = conversation.participants.find(p => p.userRef.toString() !== currentUserId);
                if (otherParticipant) {
                    const otherParticipantSocketIds = userSockets.get(otherParticipant.userRef.toString());
                    if (otherParticipantSocketIds && otherParticipantSocketIds.length > 0) {
                        otherParticipantSocketIds.forEach(socketId => {
                            userChatNamespace.to(socketId).emit('messagesRead', { conversationId, messageIds, readerId: currentUserId });
                        });
                    }
                }
            }


        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    });


    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from /user-chat with socket ${socket.id}`);
      const currentUserSocketIds = userSockets.get(socket.userId);
      if (currentUserSocketIds) {
        const index = currentUserSocketIds.indexOf(socket.id);
        if (index > -1) {
          currentUserSocketIds.splice(index, 1);
        }
        if (currentUserSocketIds.length === 0) {
          userSockets.delete(socket.userId);
        }
      }
    });
  });


  // You can add more namespaces here if needed, e.g., for PlayerChat
  const playerChatNamespace = io.of('/chat'); // Existing namespace from PlayerChat
  playerChatNamespace.on('connection', (socket) => {
    const { userId, sport, playerName } = socket.handshake.query;
    if (!userId || !sport || !playerName) {
        console.log('PlayerChat: Missing query params, disconnecting socket', socket.id);
        socket.disconnect();
        return;
    }
    const room = `${sport}-${playerName}`;
    socket.join(room);
    console.log(`User ${userId} joined player chat room ${room} with socket ${socket.id}`);

    socket.on('sendMessage', async (data) => {
        // data: { message: string, authorId: string, sport: string, playerName: string }
        // This assumes PlayerChatMessageModel exists and is correctly imported
        // For now, just broadcasting. DB saving for player chat would be separate.
        try {
            // In a full implementation, you would save this to a PlayerChatMessageModel
            // For now, just construct a basic message object to broadcast
            const authorDoc = await UserModel.findById(data.authorId).lean() || await IdentityModel.findById(data.authorId).lean();
            if (!authorDoc) {
                console.error('PlayerChat sendMessage: Author not found', data.authorId);
                return;
            }
             const messageToSend = {
                id: `playerchat-${Date.now()}`, // temp id
                player: { sport: data.sport, name: data.playerName.replace(/_/g, ' ') }, // simplified
                author: {
                    id: authorDoc._id.toString(),
                    username: authorDoc.username,
                    displayName: authorDoc.displayName || authorDoc.username,
                    profilePictureUrl: authorDoc.profilePictureUrl,
                    isIdentity: !!authorDoc.isIdentity
                },
                message: data.message,
                createdAt: new Date().toISOString()
            };
            playerChatNamespace.to(room).emit('newMessage', messageToSend);

        } catch (e) {
            console.error("Error in PlayerChat sendMessage:", e);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User ${userId} left player chat room ${room} with socket ${socket.id}`);
    });
  });


  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });

  // Handle process signals for graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    io.close(() => {
      console.log('Socket.IO server closed');
    });
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    io.close(() => {
      console.log('Socket.IO server closed');
    });
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });


}).catch(ex => {
  console.error(ex.stack);
  process.exit(1);
});
