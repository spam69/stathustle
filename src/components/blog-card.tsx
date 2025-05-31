
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Blog, Identity } from "@/types";
import { format } from 'date-fns';
import { Button } from './ui/button';
import { ArrowRight, Award } from 'lucide-react';
import { Badge } from './ui/badge';

interface BlogCardProps {
  blog: Blog;
}

export default function BlogCard({ blog }: BlogCardProps) {
  const { author, title, slug, excerpt, coverImageUrl, createdAt } = blog;

  const authorUsername = author.username;
  const authorDisplayName = 'isIdentity' in author && (author as Identity).displayName ? (author as Identity).displayName : author.username;
  const authorProfilePic = author.profilePictureUrl;
  const isIdentityAuthor = 'isIdentity' in author && (author as Identity).isIdentity;


  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      {coverImageUrl && (
        <Link href={`/blogs/${authorUsername}/${slug}`} passHref>
          <div className="aspect-[16/9] relative w-full">
            <Image src={coverImageUrl} alt={title} layout="fill" objectFit="cover" data-ai-hint="article technology"/>
          </div>
        </Link>
      )}
      <CardHeader>
        <Link href={`/blogs/${authorUsername}/${slug}`} passHref>
            <CardTitle className="text-xl md:text-2xl font-bold leading-tight hover:text-primary transition-colors font-headline">{title}</CardTitle>
        </Link>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Link href={`/profile/${authorUsername}`} passHref>
            <Avatar className="h-6 w-6">
              <AvatarImage src={authorProfilePic} alt={authorDisplayName} />
              <AvatarFallback>{getInitials(authorDisplayName)}</AvatarFallback>
            </Avatar>
          </Link>
          <Link href={`/profile/${authorUsername}`} passHref>
            <span className="font-medium hover:underline">{authorDisplayName}</span>
          </Link>
          {isIdentityAuthor && <Badge variant="outline" className="text-xs px-1.5 py-0.5"><Award className="h-3 w-3 mr-1"/>Identity</Badge>}
          <span>•</span>
          <time dateTime={createdAt}>{format(new Date(createdAt), 'MMM d, yyyy')}</time>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {excerpt && <CardDescription className="text-sm leading-relaxed">{excerpt}</CardDescription>}
      </CardContent>
      <CardFooter>
        <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline font-headline">
          <Link href={`/blogs/${authorUsername}/${slug}`}>
            Read More <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
