
"use client";

import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Player, PlayerChatMessage, User, Identity } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { mockPlayerChatMessages } from '@/lib/mock-data'; 
import { formatDistanceToNow } from 'date-fns';
import { Send, Award } from 'lucide-react';
import Link from 'next/link';
import { Badge } from './ui/badge';

interface PlayerChatProps {
  player: Player;
}

const getAuthorDisplayInfo = (author: User | Identity) => {
  const username = author.username;
  const displayName = 'isIdentity' in author && (author as Identity).displayName ? (author as Identity).displayName : author.username;
  const profilePictureUrl = author.profilePictureUrl;
  const isIdentity = 'isIdentity' in author && (author as Identity).isIdentity;
  return { username, displayName, profilePictureUrl, isIdentity };
};

export default function PlayerChat({ player }: PlayerChatProps) {
  const { user } = useAuth(); // user can be User or Identity
  const [messages, setMessages] = useState<PlayerChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const playerMessages = mockPlayerChatMessages.filter(msg => msg.player.id === player.id);
    setMessages(playerMessages);

    const intervalId = setInterval(() => {
      // console.log(`Polling for new messages for ${player.name}...`);
    }, 15000); 

    return () => clearInterval(intervalId);
  }, [player.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const chatMessage: PlayerChatMessage = {
      id: `chat-${Date.now()}`,
      player: player,
      author: user, // Author is the currently logged-in user/identity
      message: newMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, chatMessage]);
    setNewMessage('');
  };
  
  const getInitials = (name: string = "") => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'S';
  };

  const currentUserInfo = user ? getAuthorDisplayInfo(user) : null;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-headline">Chat about {player.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-muted/30">
          {messages.map(msg => {
            const authorInfo = getAuthorDisplayInfo(msg.author);
            const isCurrentUserMsg = currentUserInfo && msg.author.id === currentUserInfo.username; // Comparing by username as ID might differ for mock
            
            return (
              <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUserMsg ? 'justify-end' : ''}`}>
                {!isCurrentUserMsg && (
                  <Link href={`/profile/${authorInfo.username}`} passHref>
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={authorInfo.profilePictureUrl} alt={authorInfo.displayName} />
                      <AvatarFallback>{getInitials(authorInfo.displayName)}</AvatarFallback>
                    </Avatar>
                  </Link>
                )}
                <div className={`max-w-[70%] p-3 rounded-lg ${isCurrentUserMsg ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold mb-0.5">
                      {isCurrentUserMsg ? 'You' : authorInfo.displayName}
                    </p>
                    {authorInfo.isIdentity && !isCurrentUserMsg && <Badge variant="outline" className="text-xs px-1 py-0"><Award className="h-2.5 w-2.5 mr-0.5"/>Id</Badge>}
                  </div>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isCurrentUserMsg ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {isCurrentUserMsg && currentUserInfo &&(
                   <Link href={`/profile/${currentUserInfo.username}`} passHref>
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={currentUserInfo.profilePictureUrl} alt={currentUserInfo.displayName} />
                      <AvatarFallback>{getInitials(currentUserInfo.displayName)}</AvatarFallback>
                    </Avatar>
                  </Link>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        {currentUserInfo ? (
          <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
            <Input
              type="text"
              placeholder="Type your message (max 300 chars)..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              maxLength={300}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground w-full text-center">
            <Link href="/login" className="underline text-primary">Login</Link> to chat.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
