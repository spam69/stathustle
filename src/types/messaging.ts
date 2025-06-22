export interface Message {
  id: string;
  conversationId?: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'file' | 'gif';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participant?: UserSearchResult; // The other participant in the conversation
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
}

export interface UserSearchResult {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface FileUpload {
  file: File;
  type: string;
  size: number;
}

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'application/zip',
  'application/x-rar-compressed'
];

export const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB 