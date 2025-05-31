
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import type { Player, Post, Comment } from '@/types';
import { mockPlayers, mockPosts } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PostCard from '@/components/post-card';
import PlayerChat from '@/components/player-chat';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Shirt, Target, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

export default function PlayerPage() {
  const params = useParams();
  const { user } = useAuth();
  const sport = params.sport as string;
  const playerNameSlug = params.playerName as string; // e.g., "luka_doncic"

  const [player, setPlayer] = useState<Player | null>(null);
  const [taggedPosts, setTaggedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    if (sport && playerNameSlug) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const foundPlayer = mockPlayers.find(
          p => p.sport.toLowerCase() === sport.toLowerCase() && 
               p.name.toLowerCase().replace(/\s+/g, '_') === playerNameSlug.toLowerCase()
        );
        
        if (foundPlayer) {
          setPlayer(foundPlayer);
          // Filter posts that tag this player (mock logic)
          const postsForPlayer = mockPosts.filter(post => 
            post.tags?.some(tag => tag.toLowerCase() === `@${foundPlayer.name.toLowerCase().replace(/\s+/g, '')}`) ||
            post.content.toLowerCase().includes(foundPlayer.name.toLowerCase())
          );
          setTaggedPosts(postsForPlayer);
        } else {
          setPlayer(null);
        }
        setLoading(false);
      }, 500);
    }
  }, [sport, playerNameSlug]);

  const handleCommentAddedOnPlayerPage = (postId: string, commentText: string) => {
    if (!user) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: user,
      content: commentText,
      createdAt: new Date().toISOString(),
    };

    setTaggedPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: [...(post.comments || []), newComment].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
              repliesCount: (post.comments?.length || 0) + 1,
            }
          : post
      )
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-10 w-1/2 mb-4" />
          {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="max-w-3xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline">Player Not Found</h1>
        <p className="text-muted-foreground">
          The player profile for &quot;{playerNameSlug.replace(/_/g, ' ')}&quot; in {sport} could not be found.
        </p>
        <Link href="/" className="text-primary underline mt-4 inline-block">Go to Feed</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
      {/* Left Column: Player Info & Chat */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center p-6">
            <Avatar className="h-24 w-24 mb-4 border-2 border-primary shadow-md">
              <AvatarImage src={player.profilePictureUrl} alt={player.name} data-ai-hint="athlete portrait"/>
              <AvatarFallback className="text-3xl">{getInitials(player.name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-bold font-headline text-primary">{player.name}</CardTitle>
            <p className="text-sm text-muted-foreground capitalize">{player.sport}</p>
          </CardHeader>
          <CardContent className="text-sm space-y-2 px-6 pb-6">
            {player.team && (
              <div className="flex items-center text-muted-foreground">
                <Shirt className="h-4 w-4 mr-2 text-primary" /> Team: <span className="ml-1 font-medium text-foreground">{player.team}</span>
              </div>
            )}
            {player.position && (
              <div className="flex items-center text-muted-foreground">
                <Target className="h-4 w-4 mr-2 text-primary" /> Position: <span className="ml-1 font-medium text-foreground">{player.position}</span>
              </div>
            )}
            {/* Placeholder for more stats */}
            <div className="flex items-center text-muted-foreground">
                <Trophy className="h-4 w-4 mr-2 text-primary" /> Projections: <span className="ml-1 font-medium text-foreground">View Analyst Projections (mock)</span>
            </div>
          </CardContent>
        </Card>
        <PlayerChat player={player} />
      </div>

      {/* Right Column: Tagged Posts */}
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold mb-4 font-headline">Activity for {player.name}</h2>
        {taggedPosts.length > 0 ? (
          taggedPosts.map(post => (
            <PostCard key={post.id} post={post} onCommentAdded={handleCommentAddedOnPlayerPage} />
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">No posts found mentioning {player.name} yet.</p>
        )}
      </div>
    </div>
  );
}
