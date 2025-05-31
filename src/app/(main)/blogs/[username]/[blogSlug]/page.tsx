
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Blog, Identity } from '@/types';
import { mockBlogs } from '@/lib/mock-data';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, MessageSquare, Share2, Award } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ClientSanitizedHtml = ({ htmlContent }: { htmlContent: string }) => {
  const [sanitizedHtml, setSanitizedHtml] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSanitizedHtml(DOMPurify.sanitize(htmlContent, { USE_PROFILES: { html: true } }));
    } else {
      setSanitizedHtml(htmlContent.replace(/<script.*?>.*?<\/script>/gi, ''));
    }
  }, [htmlContent]);

  return <div className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};


export default function BlogPostPage() {
  const params = useParams();
  const usernameParam = params.username as string; // This is author's username
  const blogSlug = params.blogSlug as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (usernameParam && blogSlug) {
      setLoading(true);
      setTimeout(() => {
        const foundBlog = mockBlogs.find(
          b => b.author.username.toLowerCase() === usernameParam.toLowerCase() && b.slug === blogSlug
        );
        setBlog(foundBlog || null);
        setLoading(false);
      }, 500);
    }
  }, [usernameParam, blogSlug]);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <article className="max-w-3xl mx-auto py-8 px-4">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-64 w-full mb-8 rounded-lg" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          <Skeleton className="h-4 w-5/6" />
        </div>
      </article>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-3xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline">Blog Post Not Found</h1>
        <p className="text-muted-foreground">This blog post could not be found.</p>
         <Button asChild className="mt-4">
          <Link href="/blogs">Back to Blogs</Link>
        </Button>
      </div>
    );
  }
  
  const author = blog.author;
  const authorUsername = author.username;
  const authorDisplayName = 'isIdentity' in author && (author as Identity).displayName ? (author as Identity).displayName : author.username;
  const authorProfilePic = author.profilePictureUrl;
  const isIdentityAuthor = 'isIdentity' in author && (author as Identity).isIdentity;


  return (
    <article className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4 font-headline text-primary">
          {blog.title}
        </h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <Link href={`/profile/${authorUsername}`} passHref>
            <Avatar className="h-12 w-12">
              <AvatarImage src={authorProfilePic} alt={authorDisplayName} />
              <AvatarFallback>{getInitials(authorDisplayName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <div className="flex items-center gap-2">
                <Link href={`/profile/${authorUsername}`} passHref>
                <p className="text-sm font-medium text-foreground hover:underline">{authorDisplayName}</p>
                </Link>
                {isIdentityAuthor && <Badge variant="outline" className="text-xs px-1.5 py-0.5"><Award className="h-3 w-3 mr-1"/>Identity</Badge>}
            </div>
            <p className="text-xs">
              Published on <time dateTime={blog.createdAt}>{format(new Date(blog.createdAt), 'MMMM d, yyyy')}</time>
            </p>
          </div>
        </div>
      </header>

      {blog.coverImageUrl && (
        <div className="mb-8 aspect-video relative overflow-hidden rounded-lg shadow-lg">
          <Image src={blog.coverImageUrl} alt={blog.title} layout="fill" objectFit="cover" data-ai-hint="article technology" />
        </div>
      )}
      
      <ClientSanitizedHtml htmlContent={blog.content} />

      <footer className="mt-12 border-t pt-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Found this interesting?</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" /> Create Feed Post
            </Button>
            <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
          </div>
        </div>
      </footer>
    </article>
  );
}
