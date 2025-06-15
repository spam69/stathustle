"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/app/(main)/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Trophy, Gauge, User, Users, Calendar, Settings, ChevronRight, BarChart, Shield, Search } from "lucide-react";
import { CreateTeamDialog } from "@/components/leagues/create-team-dialog";
import { JoinLeagueDialog } from "@/components/leagues/join-league-dialog";
import { useAuth } from "@/contexts/auth-context";

export default function LeaguesPage() {
  const { user } = useAuth();
  const [sportFilter, setSportFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch leagues from the API
  const { data: leagues = [], isLoading } = useQuery({
    queryKey: ['/api/leagues'],
    queryFn: async () => {
      const res = await fetch('/api/leagues');
      if (!res.ok) throw new Error('Failed to fetch leagues');
      return res.json();
    },
    enabled: !!user
  });

  if (!user) return null;

  const filteredLeagues = leagues.filter((league: any) => {
    if (sportFilter !== "all" && league.sport !== sportFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        league.name.toLowerCase().includes(query) ||
        league.platform.toLowerCase().includes(query) ||
        league.commissioner.toLowerCase().includes(query)
      );
    }
    return true;
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
      case "offseason":
        return <Badge variant="outline" className="text-amber-800 dark:text-amber-400">Off-Season</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">My Leagues</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial w-full sm:w-auto">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leagues..."
                className="pl-8 w-full sm:w-[200px] lg:w-[250px] h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
              <JoinLeagueDialog />
              <CreateTeamDialog />
            </div>
          </div>
        </div>
        
        {/* League management dialogs are handled by their own components */}
        
        {/* Sport Filter Tabs */}
        <Tabs defaultValue="all" value={sportFilter} onValueChange={setSportFilter} className="mb-6">
          <TabsList className="grid grid-cols-5 w-full max-w-md overflow-x-auto">
            <TabsTrigger value="all" className="text-xs sm:text-sm px-1 sm:px-3">All</TabsTrigger>
            <TabsTrigger value="football" className="text-xs sm:text-sm px-1 sm:px-3">🏈 NFL</TabsTrigger>
            <TabsTrigger value="basketball" className="text-xs sm:text-sm px-1 sm:px-3">🏀 NBA</TabsTrigger>
            <TabsTrigger value="baseball" className="text-xs sm:text-sm px-1 sm:px-3">⚾ MLB</TabsTrigger>
            <TabsTrigger value="hockey" className="text-xs sm:text-sm px-1 sm:px-3">🏒 NHL</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Leagues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLeagues.map(league => (
            <Card key={league.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-200">
                        {league.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{league.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        {league.platform} • {league.members} members
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(league.status)}
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Commissioner</span>
                    <span className="font-medium">{league.commissioner}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Teams Owned</span>
                    <span className="font-medium">{league.teams}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <div className="w-full flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm flex-1 sm:flex-none">
                      <Trophy className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                      Standings
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm flex-1 sm:flex-none">
                      <Users className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                      Members
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs sm:text-sm mt-2 sm:mt-0">
                    <Shield className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                    League Home
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {/* Empty State */}
        {filteredLeagues.length === 0 && (
          <Card className="mt-6 p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
              <Trophy className="h-10 w-10 text-primary-500" />
            </div>
            <h3 className="mt-6 text-lg font-medium">No leagues found</h3>
            <p className="mt-2 text-muted-foreground">
              {sportFilter === "all" 
                ? "You haven't joined any fantasy leagues yet." 
                : `You don't have any ${sportFilter} leagues.`}
            </p>
            <Button className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Join League
            </Button>
          </Card>
        )}
        
        {/* League Activity Section */}
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-2xl font-bold">Recent League Activity</h2>
            <Button variant="outline" className="text-xs sm:text-sm w-full sm:w-auto">
              <BarChart className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
              View All
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>League Updates</CardTitle>
              <CardDescription>Recent activity from your fantasy leagues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-md hover:bg-accent cursor-pointer">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 flex-shrink-0">
                      <AvatarFallback className="bg-green-100 text-green-800 text-xs sm:text-sm">📊</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">Trade Completed</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Dynasty Football League • 2 hours ago</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-md hover:bg-accent cursor-pointer">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-800 text-xs sm:text-sm">🔄</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">Waiver Claim Processed</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">3-Point Shooters • 5 hours ago</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-md hover:bg-accent cursor-pointer">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 flex-shrink-0">
                      <AvatarFallback className="bg-amber-100 text-amber-800 text-xs sm:text-sm">📝</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">Draft Date Changed</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Stanley Cup Chasers • Yesterday</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 