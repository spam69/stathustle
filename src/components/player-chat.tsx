
"use client";

import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Player, PlayerChatMessage, User, Identity } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { Send, Award } from 'lucide-react';
import Link from 'next/link';
import { Badge } from './ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface PlayerChatProps {
  player: Player;
}

const fetchChatMessages = async (sport: string, playerNameSlug: string): Promise<PlayerChatMessage[]> => {
  const response = await fetch(`/api/players/${sport}/${playerNameSlug.replace(/\s+/g, '_')}/chat`);
  if (!response.ok) throw new Error("Failed to fetch chat messages");
  return response.json();
};

const postChatMessage = async (data: { sport: string, playerNameSlug: string, message: string, authorId: string }): Promise<PlayerChatMessage> => {
  const { sport, playerNameSlug, ...payload } = data;
  const response = await fetch(`/api/players/${sport}/${playerNameSlug.replace(/\s+/g, '_')}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to post message");
  }
  return response.json();
};

const getAuthorDisplayInfo = (author: User | Identity) => {
  const username = author.username;
  const displayName = 'isIdentity' in author && (author as Identity).displayName ? (author as Identity).displayName : author.username;
  const profilePictureUrl = author.profilePictureUrl;
  const isIdentity = 'isIdentity' in author && (author as Identity).isIdentity;
  return { username, displayName, profilePictureUrl, isIdentity };
};

export default function PlayerChat({ player }: PlayerChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');

  const playerNameSlug = player.name.toLowerCase().replace(/\s+/g, '_');
  const queryKey = ['playerChat', player.sport, playerNameSlug];

  const { data: messages = [], isLoading, error } = useQuery<PlayerChatMessage[], Error>({
    queryKey: queryKey,
    queryFn: () => fetchChatMessages(player.sport, playerNameSlug),
    refetchInterval: 15000, // Poll for new messages every 15 seconds
  });

  const mutation = useMutation<PlayerChatMessage, Error, { message: string }>({
    mutationFn: ({ message }) => {
      if (!user) throw new Error("User not logged in");
      return postChatMessage({ sport: player.sport, playerNameSlug, message, authorId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewMessage('');
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message || "Could not send message.", variant: "destructive"});
    }
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    mutation.mutate({ message: newMessage.trim() });
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
          {isLoading && (
            <>
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
            </>
          )}
          {error && <p className="text-destructive text-center">Error loading messages: {error.message}</p>}
          {!isLoading && !error && messages.map(msg => {
            const authorInfo = getAuthorDisplayInfo(msg.author);
            const isCurrentUserMsg = currentUserInfo && msg.author.id === user?.id;
            
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
              disabled={mutation.isPending}
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim() || mutation.isPending}>
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

    