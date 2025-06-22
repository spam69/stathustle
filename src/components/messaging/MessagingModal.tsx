import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { useAuth } from '@/contexts/auth-context';
import { Message, Conversation, UserSearchResult } from '@/types/messaging';
import { FileUpload } from '@/components/FileUpload';
import GiphyPickerModal from '@/components/giphy-picker-modal';
import { ImageIcon, GiftIcon, SendIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import type { IGif } from '@giphy/js-types';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagingModal({ isOpen, onClose }: MessagingModalProps) {
  const {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    searchUsers,
    sendMessage,
    startConversation,
    loadMoreMessages,
    setCurrentConversation
  } = useMessagingContext();

  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isGiphyModalOpen, setIsGiphyModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      await sendMessage(messageInput, 'text');
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      await sendMessage('', 'file', file);
    } catch (error) {
      console.error('Failed to send file:', error);
    }
  };

  const handleGifSelect = async (gif: IGif) => {
    try {
      await sendMessage(gif.images.downsized_medium?.url || gif.images.original.url, 'gif');
      setIsGiphyModalOpen(false);
    } catch (error) {
      console.error('Failed to send GIF:', error);
    }
  };

  const handleStartConversation = async (userId: string) => {
    try {
      await startConversation(userId);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0) {
      loadMoreMessages();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-4 pb-2 border-b">
          <DialogTitle className="text-lg font-semibold">Messages</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 h-0">
          {/* Conversations List */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-4 border-b">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <ScrollArea className="flex-1">
              {searchQuery ? (
                <div className="p-2">
                  {isSearching ? (
                    <div className="text-center py-4">Searching...</div>
                  ) : (
                    searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center p-2 hover:bg-accent cursor-pointer"
                        onClick={() => handleStartConversation(user.id)}
                      >
                        <div className="relative w-10 h-10 mr-3">
                          <Image
                            src={user.avatar || '/default-avatar.png'}
                            alt={user.username}
                            fill
                            className="rounded-full object-cover"
                          />
                          {user.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="p-2">
                  {[...new Map(conversations.map(c => [c.id, c])).values()].map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`flex items-center p-2 hover:bg-accent cursor-pointer ${
                        currentConversation?.id === conversation.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setCurrentConversation(conversation)}
                    >
                      <div className="relative w-10 h-10 mr-3">
                        <Image
                          src={conversation.participant?.avatar || '/default-avatar.png'}
                          alt={conversation.participant?.username || 'User'}
                          fill
                          className="rounded-full object-cover"
                        />
                        {conversation.participant?.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate">
                            {conversation.participant?.displayName || conversation.participant?.username}
                          </div>
                          {conversation.unreadCount > 0 && (
                            <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col min-h-0">
            {currentConversation ? (
              <>
                <div className="p-4 border-b">
                  <div className="flex items-center">
                    <div className="relative w-10 h-10 mr-3">
                      <Image
                        src={currentConversation.participant?.avatar || '/default-avatar.png'}
                        alt={currentConversation.participant?.username || 'User'}
                        fill
                        className="rounded-full object-cover"
                      />
                      {currentConversation.participant?.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {currentConversation.participant?.displayName || currentConversation.participant?.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {currentConversation.participant?.isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>
                </div>

                <ScrollArea
                  ref={scrollAreaRef}
                  className="flex-1 p-4 min-h-0"
                  onScroll={handleScroll}
                >
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isFromCurrentUser = message.senderId === user?.id;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isFromCurrentUser
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isFromCurrentUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.type === 'text' && <div>{message.content}</div>}
                            {message.type === 'file' && (
                              <div>
                                {message.fileType?.startsWith('image/') ? (
                                  <Image
                                    src={message.fileUrl!}
                                    alt={message.fileName || 'File'}
                                    width={200}
                                    height={200}
                                    className="rounded-lg"
                                  />
                                ) : (
                                  <a
                                    href={message.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-sm hover:underline"
                                  >
                                    {message.fileName}
                                  </a>
                                )}
                              </div>
                            )}
                            {message.type === 'gif' && (
                              <Image
                                src={message.content}
                                alt="GIF"
                                width={200}
                                height={200}
                                className="rounded-lg"
                              />
                            )}
                            <div className="text-xs mt-1 opacity-70">
                              {formatDistanceToNow(new Date(message.createdAt), {
                                addSuffix: true
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background z-10">
                  <div className="flex items-center space-x-2">
                    <FileUpload onUpload={handleFileUpload}>
                      <Button variant="ghost" size="icon">
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                    </FileUpload>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsGiphyModalOpen(true)}
                    >
                      <GiftIcon className="h-5 w-5" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage}>
                      <SendIcon className="h-5 w-5" />
                    </Button>
                  </div>
                  <GiphyPickerModal
                    isOpen={isGiphyModalOpen}
                    onClose={() => setIsGiphyModalOpen(false)}
                    onGifSelect={handleGifSelect}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a conversation or start a new one
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 