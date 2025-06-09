
// src/lib/dbConnect.ts
import mongoose from 'mongoose';

// Ensure all models are imported here to register them with Mongoose
import '@/models/User.model';
import '@/models/Identity.model';
import '@/models/Post.model';
import '@/models/Comment.model';
import '@/models/Blog.model';
import '@/models/Player.model';
import '@/models/Notification.model';


const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env'
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS.Global interface to include the mongoose cache
declare global {
  // eslint-disable-next-line no-unused-vars
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      console.log('MongoDB Connected');
      return mongooseInstance;
    }).catch(err => {
      console.error('MongoDB Connection Error:', err);
      cached!.promise = null; // Reset promise on error so next attempt can try again
      throw err; // Rethrow error to be caught by caller
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default dbConnect;

