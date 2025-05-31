
"use client";

import BlogCard from '@/components/blog-card';
import type { Blog } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';

const fetchBlogs = async (): Promise<Blog[]> => {
  const response = await fetch('/api/blogs');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export default function BlogsPage() {
  const { data: blogs, isLoading, error } = useQuery<Blog[], Error>({
    queryKey: ['blogs'],
    queryFn: fetchBlogs,
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8 font-headline text-primary">Blogs</h1>
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
      <h1 className="text-3xl font-bold mb-8 font-headline text-primary">Blogs</h1>
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

    