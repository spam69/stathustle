"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";// For fetching identity name based on ID
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Identity, User, TeamMember } from "@/types";
import { useAuth } from '@/contexts/auth-context';

export default function ManageTeamPage() {
  const params = useParams();
  const router = useRouter();
  const identityId = params.identityId as string;
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addInput, setAddInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removeLoadingId, setRemoveLoadingId] = useState<string | null>(null);
  const { user: currentUser, originalUser } = useAuth();

  // Fetch identity and team members
  useEffect(() => {
    async function fetchIdentity() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/identities/${identityId}`);
        if (!res.ok) throw new Error("Failed to fetch identity");
        const data = await res.json();
        setIdentity(data);
        setTeamMembers(data.teamMembers || []);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    if (identityId) fetchIdentity();
  }, [identityId]);

  // Add team member by username or email
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch(`/api/identities/${identityId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: addInput }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add member");
      }
      const updated = await res.json();
      setTeamMembers(updated.teamMembers || []);
      setAddInput("");
    } catch (e: any) {
      setAddError(e.message || "Unknown error");
    } finally {
      setAddLoading(false);
    }
  }

  // Remove team member
  async function handleRemoveMember(userId: string) {
    setRemoveLoadingId(userId);
    setError(null);
    try {
      const res = await fetch(`/api/identities/${identityId}/team`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to remove member");
      }
      const updated = await res.json();
      setTeamMembers(updated.teamMembers || []);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setRemoveLoadingId(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">
            Manage Team for {identity ? `@${identity.username}` : "Identity"}
          </CardTitle>
          <CardDescription>
            Invite members by username or email. Remove members instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground mb-4">Loading...</p>
          ) : error ? (
            <p className="text-destructive mb-4">{error}</p>
          ) : (
            <>
              <form onSubmit={handleAddMember} className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="border rounded px-2 py-1 flex-1"
                  placeholder="Username or Email"
                  value={addInput}
                  onChange={e => setAddInput(e.target.value)}
                  disabled={addLoading}
                  required
                />
                <Button type="submit" disabled={addLoading || !addInput.trim()}>
                  {addLoading ? "Adding..." : "Add Member"}
                </Button>
              </form>
              {addError && <p className="text-destructive mb-2">{addError}</p>}
              {teamMembers.length > 0 ? (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Current Team Members:</h3>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {teamMembers.map(member => (
                      <li key={member.user.id} className="flex items-center gap-2 mb-1">
                        <span>@{member.user.username}</span>
                        {member.user.email && <span className="text-xs text-muted-foreground">({member.user.email})</span>}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMember(member.user.id)}
                          disabled={removeLoadingId === member.user.id || (originalUser && member.user.id === originalUser.id)}
                        >
                          {removeLoadingId === member.user.id ? "Removing..." : "Remove"}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-muted-foreground mb-4">No team members yet.</p>
              )}
            </>
          )}
          <Button variant="outline" asChild>
            <Link href="/settings">Back to Settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
