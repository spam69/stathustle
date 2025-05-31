
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function CreateIdentityPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Create New Identity</CardTitle>
          <CardDescription>
            Establish your analyst brand on StatHustle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The full form for creating an identity with username, display name, bio, etc., will be available here soon.
          </p>
          <p className="text-muted-foreground mb-6">
            Once created, you'll be able to manage your identity's profile, team members, and permissions.
          </p>
          <Button variant="outline" asChild>
            <Link href="/settings">Back to Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
