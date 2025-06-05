
"use client";

import { useState } from 'react';
import BlogCard from '@/components/blog-card';
import type { Blog, Identity } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fetchBlogs = async (): Promise<Blog[]> => {
  const response = await fetch('/api/blogs');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export default function BlogsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("public");

  const { data: allBlogs, isLoading, error } = useQuery<Blog[], Error>({
    queryKey: ['blogs'],
    queryFn: fetchBlogs,
  });

  const myBlogs = user && allBlogs
    ? allBlogs.filter(blog => {
        if (blog.author.isIdentity) {
          return (blog.author as Identity).owner.id === user.id;
        }
        return blog.author.id === user.id;
      })
    : [];

  const renderBlogList = (blogsToList: Blog[] | undefined, tabName: string) => {
    if (isLoading) {
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
      );
    }

    if (error) {
      return (
        <div className="max-w-3xl mx-auto text-center py-10 mt-6">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold font-headline">Error Loading Blogs</h1>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      );
    }

    if (blogsToList && blogsToList.length > 0) {
      return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 mt-6">
          {blogsToList.map(blog => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      );
    }

    return (
      <p className="text-muted-foreground text-center py-12">
        {tabName === "My Blogs" ? "You haven't written any blogs yet." : "No blog posts available yet."}
      </p>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-headline text-primary">Blogs</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2">
          <TabsTrigger value="public">Public Blogs</TabsTrigger>
          <TabsTrigger value="my-blogs">My Blogs</TabsTrigger>
        </TabsList>

        <TabsContent value="public">
          {renderBlogList(allBlogs, "Public Blogs")}
        </TabsContent>

        <TabsContent value="my-blogs">
          {user ? (
            <>
              <div className="flex justify-end mt-6">
                <Button asChild variant="default" size="default" className="font-headline">
                  <Link href="/blogs/create">
                    <PlusCircle className="mr-2 h-5 w-5" /> Write your own blog
                  </Link>
                </Button>
              </div>
              {renderBlogList(myBlogs, "My Blogs")}
            </>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              Please <Link href="/login" className="underline text-primary">login</Link> to see your blogs.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
