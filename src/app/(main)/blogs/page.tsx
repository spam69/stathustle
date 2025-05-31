"use client";

import { useState, useEffect } from 'react';
import BlogCard from '@/components/blog-card';
import type { Blog } from '@/types';
import { mockBlogs } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setBlogs(mockBlogs);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 font-headline text-primary">Blogs</h1>
      {blogs.length > 0 ? (
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
