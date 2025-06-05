
"use client";

import BlogCard from '@/components/blog-card';
import type { Blog } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

const fetchBlogs = async (): Promise<Blog[]> => {
  const response = await fetch('/api/blogs');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export default function BlogsPage() {
  const { user } = useAuth(); // Get current user
  const { data: blogs, isLoading, error } = useQuery<Blog[], Error>({
    queryKey: ['blogs'],
    queryFn: fetchBlogs,
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold font-headline text-primary">Blogs</h1>
          {user && (
            <Button asChild>
              <Link href="/blogs/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Write your own blog
              </Link>
            </Button>
          )}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
     return (
      <div className="max-w-3xl mx-auto text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold font-headline">Error Loading Blogs</h1>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-headline text-primary">Blogs</h1>
        {user && (
          <Button asChild variant="default" size="default" className="font-headline">
            <Link href="/blogs/create">
              <PlusCircle className="mr-2 h-5 w-5" /> Write your own blog
            </Link>
          </Button>
        )}
      </div>
      {blogs && blogs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {blogs.map(blog => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">No blog posts available yet.</p>
      )}
    </div>
  );
}

    
