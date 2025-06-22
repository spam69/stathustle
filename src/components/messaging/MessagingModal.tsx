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
import EmojiPicker from '@/components/emoji-picker';
import { FilePlaceholder } from '@/components/ui/file-placeholder';
import { ImageIcon, SendIcon, Film, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import type { IGif } from '@giphy/js-types';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [showConversation, setShowConversation] = useState(false);
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

  useEffect(() => {
    if (!isMobile) {
      setShowConversation(true);
    } else {
      setShowConversation(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (currentConversation && isMobile) {
      setShowConversation(true);
    }
  }, [currentConversation, isMobile]);

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

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
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
      <DialogContent className="max-w-4xl h-[80vh] md:h-[70vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-4 pb-2 border-b">
          <DialogTitle className="text-lg font-semibold">Messages</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 h-0">
          {/* Conversations List */}
          {(!showConversation || !isMobile) && (
            <div className={`border-r flex flex-col ${isMobile ? 'w-full' : 'w-1/3'}`}>
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
          )}

          {/* Messages */}
          {showConversation && (
            <div className={`flex-1 flex flex-col min-h-0 ${isMobile ? 'w-full' : ''}`}>
              {currentConversation ? (
                <>
                  <div className="p-4 border-b">
                    <div className="flex items-center">
                      {isMobile && (
                        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setShowConversation(false)}>
                          <ArrowLeft className="h-6 w-6" />
                        </Button>
                      )}
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
                                : 'items-end'
                            }`}
                          >
                            {!isFromCurrentUser && (
                              <div className="relative w-8 h-8 mr-2 flex-shrink-0">
                                <Image
                                  src={currentConversation.participant?.avatar || '/default-avatar.png'}
                                  alt={currentConversation.participant?.username || 'User'}
                                  fill
                                  className="rounded-full object-cover"
                                />
                              </div>
                            )}
                            <div
                              className={`p-3 rounded-lg max-w-xs lg:max-w-md ${
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
                                    <FilePlaceholder
                                      fileName={message.fileName || 'Unknown File'}
                                      fileType={message.fileType}
                                      fileUrl={message.fileUrl}
                                      className="w-32 h-32"
                                    />
                                  )}
                                </div>
                              )}
                              {message.type === 'gif' && (
                                <div>
                                  <Image 
                                    src={message.content}
                                    alt="gif"
                                    width={200}
                                    height={200}
                                    unoptimized
                                    className="rounded-lg"
                                  />
                                  <div className="text-xs text-right mt-1 text-muted-foreground">
                                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })} via Giphy
                                  </div>
                                </div>
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

                  <div className="p-4 border-t flex flex-row space-x-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="pr-24"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <FileUpload onUpload={handleFileUpload}>
                          <Button variant="ghost" size="icon" className='text-primary hover:bg-primary/10'>
                            <ImageIcon className="h-5 w-5" />
                          </Button>
                        </FileUpload>
                        <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => setIsGiphyModalOpen(true)}>
                          <Film className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    <Button onClick={handleSendMessage}>
                      <SendIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-2xl font-semibold mb-2">Select a conversation</div>
                  <div className="text-muted-foreground">
                    Start a new one by searching for users.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
      <GiphyPickerModal
        isOpen={isGiphyModalOpen}
        onClose={() => setIsGiphyModalOpen(false)}
        onGifSelect={handleGifSelect}
      />
    </Dialog>
  );
} 