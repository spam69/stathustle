
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { TrendingUp, UserPlus, Settings2 } from "lucide-react";

const mockTrendingTopics = [
  { id: "t1", name: "#FantasyFootballDraft", category: "Football - 12.1k Posts" },
  { id: "t2", name: "PlayerInjuryUpdates", category: "Sports - 8.7k Posts" },
  { id: "t3", name: "#NBAPlayoffs", category: "Basketball - 22.5k Posts" },
  { id: "t4", name: "NewSignings", category: "Sports - 5.2k Posts" },
];

const mockWhoToFollow = [
  { id: "u1", username: "ExpertAnalyst", displayName: "Dr. Stats", profilePictureUrl: "https://placehold.co/100x100.png?text=EA", bio: "Top-tier fantasy advice." },
  { id: "u2", username: "HoopsInsider", displayName: "Hoops Insider", profilePictureUrl: "https://placehold.co/100x100.png?text=HI", bio: "NBA news and rumors." },
  { id: "u3", username: "GridironGuru", displayName: "Gridiron Guru", profilePictureUrl: "https://placehold.co/100x100.png?text=GG", bio: "Football strategy and tips." },
];

export default function RightSidebar() {
  const getInitials = (name: string = "") => name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <aside className="w-80 min-w-[20rem] space-y-6 p-4 pt-0 border-l border-border overflow-y-auto h-full">
      <Card className="bg-card/50 shadow-none border-none">
        <CardHeader className="px-2 pt-4 pb-2">
          <CardTitle className="text-lg font-headline flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-primary" /> Trending Topics</CardTitle>
        </CardHeader>
        <CardContent className="px-2 space-y-1">
          {mockTrendingTopics.map(topic => (
            <Link href="#" key={topic.id} className="block p-2.5 rounded-lg hover:bg-accent/10 transition-colors">
              <p className="font-semibold text-sm text-foreground">{topic.name}</p>
              <p className="text-xs text-muted-foreground">{topic.category}</p>
            </Link>
          ))}
          <Button variant="link" className="p-2.5 text-primary text-sm">Show more</Button>
        </CardContent>
      </Card>

      <Card className="bg-card/50 shadow-none border-none">
        <CardHeader className="px-2 pt-4 pb-2">
          <CardTitle className="text-lg font-headline flex items-center"><UserPlus className="mr-2 h-5 w-5 text-primary" /> Who to Follow</CardTitle>
        </CardHeader>
        <CardContent className="px-2 space-y-2">
          {mockWhoToFollow.map(user => (
            <div key={user.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-accent/10 transition-colors">
              <Link href={`/profile/${user.username}`} className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={user.profilePictureUrl} alt={user.displayName} data-ai-hint="person avatar"/>
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-foreground hover:underline">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </Link>
              <Button variant="outline" size="sm" className="rounded-full text-xs px-3 py-1 h-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground">Follow</Button>
            </div>
          ))}
          <Button variant="link" className="p-2.5 text-primary text-sm">Show more</Button>
        </CardContent>
      </Card>
       <div className="p-2 text-xs text-muted-foreground space-x-2">
        <Link href="#" className="hover:underline">Terms of Service</Link>
        <Link href="#" className="hover:underline">Privacy Policy</Link>
        <Link href="#" className="hover:underline">Cookie Policy</Link>
        <span>&copy; {new Date().getFullYear()} StatHustle</span>
      </div>
    </aside>
  );
}
