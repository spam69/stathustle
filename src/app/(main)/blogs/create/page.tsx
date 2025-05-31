
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from 'next/navigation';
import Link from "next/link";

export default function CreateBlogPage() {
  const searchParams = useSearchParams();
  const identityId = searchParams.get('identityId');

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Create New Blog Post</CardTitle>
          <CardDescription>
            Share your insights and analysis with the StatHustle community.
            {identityId && <span className="block mt-1">Posting as Identity ID: {identityId}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            A rich text editor for creating blog posts with inline images will be available here soon.
          </p>
          <Button variant="outline" asChild>
            <Link href="/blogs">Back to Blogs</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
