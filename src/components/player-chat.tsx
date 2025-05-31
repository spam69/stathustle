"use client";

import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Player, PlayerChatMessage, User } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { mockPlayerChatMessages } from '@/lib/mock-data'; // Using mockUser1 for initial interests
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';

interface PlayerChatProps {
  player: Player;
}

export default function PlayerChat({ player }: PlayerChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<PlayerChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load of messages for this player (mocked)
    const playerMessages = mockPlayerChatMessages.filter(msg => msg.player.id === player.id);
    setMessages(playerMessages);

    // Simulate polling for new messages
    const intervalId = setInterval(() => {
      // In a real app, fetch new messages since last fetch for this player.
      // For mock, we can randomly add a new message or do nothing.
      // This is a very basic polling simulation.
      // console.log(`Polling for new messages for ${player.name}...`);
    }, 15000); // Poll every 15 seconds

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
      author: user,
      message: newMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, chatMessage]);
    setNewMessage('');
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-headline">Chat about {player.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-muted/30">
          {messages.map(msg => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.author.id === user?.id ? 'justify-end' : ''}`}>
              {msg.author.id !== user?.id && (
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={msg.author.profilePictureUrl} alt={msg.author.username} />
                  <AvatarFallback>{getInitials(msg.author.username)}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[70%] p-3 rounded-lg ${msg.author.id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                <p className="text-xs font-semibold mb-0.5">
                  {msg.author.id === user?.id ? 'You' : msg.author.username}
                </p>
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 ${msg.author.id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </p>
              </div>
              {msg.author.id === user?.id && (
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={msg.author.profilePictureUrl} alt={msg.author.username} />
                  <AvatarFallback>{getInitials(msg.author.username)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        {user ? (
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
