
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockIdentities } from "@/lib/mock-data"; // For fetching identity name based on ID
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Identity } from "@/types";

export default function ManageTeamPage() {
  const params = useParams();
  const router = useRouter();
  const identityId = params.identityId as string;
  const [identity, setIdentity] = useState<Identity | null>(null);

  useEffect(() => {
    if (identityId) {
      const foundIdentity = mockIdentities.find(id => id.id === identityId);
      if (foundIdentity) {
        setIdentity(foundIdentity);
      } else {
        // Handle identity not found, e.g. redirect or show error
        // router.push('/settings'); 
      }
    }
  }, [identityId, router]);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">
            Manage Team for {identity ? `@${identity.username}` : "Identity"}
          </CardTitle>
          <CardDescription>
            Invite members, assign roles, and manage permissions for your analyst identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Team management features including member invitations and permission settings will be available here soon.
          </p>
           {identity && identity.teamMembers && identity.teamMembers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Current Team Members:</h3>
              <ul className="list-disc pl-5 text-muted-foreground">
                {identity.teamMembers.map(member => (
                  <li key={member.user.id}>
                    @{member.user.username} (Permissions: {member.permissions.join(', ') || 'None'})
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Button variant="outline" asChild>
            <Link href="/settings">Back to Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
