
"use client";

import type { ChangeEvent, FormEvent} from 'react';
import { useState, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'support' | 'system';
  timestamp: string;
  username?: string;
  avatarUrl?: string;
}

interface LiveSupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'S';
};

export default function LiveSupportChat({ isOpen, onClose }: LiveSupportChatProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const newSocket = io(); // Connects to the server hosting the web page.
                              // For a separate chat server: io('http://localhost:3001');

      newSocket.on('connect', () => {
        setIsConnected(true);
        setMessages(prev => [...prev, { id: 'system-connect', text: 'Connected to support chat.', sender: 'system', timestamp: new Date().toISOString() }]);
        if (user) {
          newSocket.emit('join_support_room', { userId: user.id, username: user.username });
        }
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        setMessages(prev => [...prev, { id: 'system-disconnect', text: 'Disconnected from support chat.', sender: 'system', timestamp: new Date().toISOString() }]);
      });

      newSocket.on('support_message', (message: { text: string, username?: string, avatarUrl?: string }) => {
        setMessages(prev => [...prev, { 
          id: `support-${Date.now()}`, 
          text: message.text, 
          sender: 'support', 
          timestamp: new Date().toISOString(),
          username: message.username || 'Support',
          avatarUrl: message.avatarUrl
        }]);
      });
      
      newSocket.on('user_message_echo', (message: { text: string }) => {
        // Optional: if server echoes back user's own message for confirmation
        // This client already adds it optimistically
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
        setMessages([]); // Clear messages when chat is closed
    }
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && socket && user) {
      const messageData: ChatMessage = {
        id: `user-${Date.now()}`,
        text: inputValue,
        sender: 'user',
        timestamp: new Date().toISOString(),
        username: user.username,
        avatarUrl: user.profilePictureUrl
      };
      socket.emit('user_message_to_support', { text: inputValue, userId: user.id, username: user.username });
      setMessages(prev => [...prev, messageData]);
      setInputValue('');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-[28rem] shadow-xl flex flex-col z-50 border rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          {isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
          <CardTitle className="text-base font-headline">Live Support</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        <ScrollArea className="h-full p-3">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'support' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.avatarUrl} alt={msg.username} />
                    <AvatarFallback>{getInitials(msg.username)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] p-2.5 rounded-lg text-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : msg.sender === 'support' 
                      ? 'bg-muted rounded-bl-none'
                      : 'bg-gray-200 text-gray-600 text-xs w-full text-center italic' 
                  }`}
                >
                  {msg.sender !== 'system' && msg.username && msg.sender !== 'user' && (
                    <p className="text-xs font-semibold mb-0.5">{msg.username}</p>
                  )}
                  <p>{msg.text}</p>
                  {msg.sender !== 'system' && (
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                {msg.sender === 'user' && user && (
                   <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profilePictureUrl} alt={user.username} />
                    <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t">
        {user ? (
          <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={handleInputChange}
              className="flex-1"
              disabled={!isConnected}
            />
            <Button type="submit" size="icon" disabled={!inputValue.trim() || !isConnected}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground text-center w-full">
            Please <a href="/login" className="underline text-primary">login</a> to chat.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
