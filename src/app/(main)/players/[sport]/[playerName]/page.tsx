
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import type { Player, Post, Comment as CommentType } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PostCard from '@/components/post-card';
import PlayerChat from '@/components/player-chat';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Shirt, Target, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useQuery } from '@tanstack/react-query';
import { useFeed } from '@/contexts/feed-context'; // For post interactions

const fetchPlayerDetails = async (sport: string, playerNameSlug: string): Promise<Player> => {
  const response = await fetch(`/api/players/${sport}/${playerNameSlug}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Player not found');
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// We'll filter allFeedPosts on the client side for posts mentioning the player.
// A dedicated API endpoint for player-tagged posts could be a future optimization.

export default function PlayerPage() {
  const params = useParams();
  const { user } = useAuth();
  const sport = params.sport as string;
  const playerNameSlug = params.playerName as string; 

  const { 
    posts: allFeedPosts, 
    addCommentToFeedPost, 
    likeFeedPost, 
    likeFeedComment,
    isPostsLoading: isFeedLoading,
  } = useFeed();

  const { data: player, isLoading: isPlayerLoading, error: playerError } = useQuery<Player, Error>({
    queryKey: ['player', sport, playerNameSlug],
    queryFn: () => fetchPlayerDetails(sport, playerNameSlug),
    enabled: !!sport && !!playerNameSlug,
  });

  const [taggedPosts, setTaggedPosts] = useState<Post[]>([]);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    if (player && allFeedPosts) {
      const postsForPlayer = allFeedPosts.filter(post => 
        post.tags?.some(tag => tag.toLowerCase() === `@${player.name.toLowerCase().replace(/\s+/g, '')}`) ||
        post.content.toLowerCase().includes(player.name.toLowerCase())
      ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTaggedPosts(postsForPlayer);
    }
  }, [player, allFeedPosts]);

  const isLoading = isPlayerLoading || isFeedLoading;

  if (isLoading) {
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

  if (playerError || !player) {
    return (
      <div className="max-w-3xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline">Player Not Found</h1>
        <p className="text-muted-foreground">
          {playerError ? playerError.message : `The player profile for "${playerNameSlug.replace(/_/g, ' ')}" in ${sport} could not be found.`}
        </p>
        <Link href="/" className="text-primary underline mt-4 inline-block">Go to Feed</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
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
            <div className="flex items-center text-muted-foreground">
                <Trophy className="h-4 w-4 mr-2 text-primary" /> Projections: <span className="ml-1 font-medium text-foreground">View Analyst Projections (mock)</span>
            </div>
          </CardContent>
        </Card>
        <PlayerChat player={player} />
      </div>

      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold mb-4 font-headline">Activity for {player.name}</h2>
        {taggedPosts.length > 0 ? (
          taggedPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onCommentAdded={(postId, content, parentId) => addCommentToFeedPost({ postId, content, parentId })}
              onLikeComment={(postId, commentId) => likeFeedComment({ postId, commentId })}
              onLikePost={likeFeedPost}
            />
          ))
        ) : (
          <p className="text-muted-foreground text-center py-8">No posts found mentioning {player.name} yet.</p>
        )}
      </div>
    </div>
  );
}

    