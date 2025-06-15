"use client";
import { useState } from "react";
import MainLayout from "@/app/(main)/layout";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart, ListFilter, ChevronDown, Zap, TrendingUp, Trophy, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatsDashboard } from "@/components/stats-dashboard";

// Mock data for charts
const performanceData = [
  { name: 'Week 1', points: 78 },
  { name: 'Week 2', points: 92 },
  { name: 'Week 3', points: 85 },
  { name: 'Week 4', points: 120 },
  { name: 'Week 5', points: 95 },
  { name: 'Week 6', points: 88 },
  { name: 'Week 7', points: 130 },
  { name: 'Week 8', points: 110 },
];

const teamCompositionData = [
  { name: 'QB', value: 25 },
  { name: 'RB', value: 30 },
  { name: 'WR', value: 20 },
  { name: 'TE', value: 10 },
  { name: 'K', value: 5 },
  { name: 'DEF', value: 10 },
];

const playerPerformanceData = [
  { name: 'Patrick Mahomes', points: 290 },
  { name: 'Derrick Henry', points: 260 },
  { name: 'Justin Jefferson', points: 240 },
  { name: 'Travis Kelce', points: 210 },
  { name: 'Nick Chubb', points: 200 },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState("season");
  const [sport, setSport] = useState("football");
  
  if (!user) return null;
  
  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger className="w-full sm:w-[150px] text-xs sm:text-sm h-9">
                  <SelectValue placeholder="Select Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="football">Football</SelectItem>
                  <SelectItem value="basketball">Basketball</SelectItem>
                  <SelectItem value="baseball">Baseball</SelectItem>
                  <SelectItem value="hockey">Hockey</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeFrame} onValueChange={setTimeFrame}>
                <SelectTrigger className="w-full sm:w-[150px] text-xs sm:text-sm h-9">
                  <SelectValue placeholder="Time Frame" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="season">This Season</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" size="icon" className="h-9 w-9 hidden sm:flex">
              <ListFilter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Stats Dashboard */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
          <div className="w-full overflow-x-auto">
            <StatsDashboard 
              sportFilter={sport} 
              stats={[
                { title: "Total Points", value: "1,245", trend: { direction: "up", value: "+12%" } },
                { title: "League Rank", value: "3rd", trend: { direction: "neutral", value: "No change" } },
                { title: "Win Rate", value: "68%", trend: { direction: "up", value: "+5%" } },
                { title: "Player Efficiency", value: "92.4", trend: { direction: "down", value: "-1.2" } }
              ]} 
            />
          </div>
        </div>
        
        {/* Main Charts */}
        <Tabs defaultValue="performance" className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="performance" className="flex items-center">
              <LineChart className="mr-2 h-4 w-4" />
              Performance Trends
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center">
              <PieChart className="mr-2 h-4 w-4" />
              Team Composition
            </TabsTrigger>
            <TabsTrigger value="players" className="flex items-center">
              <BarChart className="mr-2 h-4 w-4" />
              Player Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance</CardTitle>
                <CardDescription>
                  Your fantasy points scored over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-lg text-muted-foreground">
                  Performance chart will be displayed here with your fantasy league data
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Composition</CardTitle>
                <CardDescription>
                  Breakdown of your roster by position
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-lg text-muted-foreground">
                  Team composition pie chart will be displayed here with your roster data
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="players">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Players</CardTitle>
                <CardDescription>
                  Your highest-scoring players this season
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-lg text-muted-foreground">
                  Player performance bar chart will be displayed here with your roster's stats
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Insights Section */}
        <h2 className="text-2xl font-bold mb-4">Insights & Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Insights</CardTitle>
              <CardDescription>
                Data-driven suggestions for your fantasy team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full mr-2 mt-0.5">
                    <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="font-medium">Start Patrick Mahomes</span>
                    <p className="text-sm text-muted-foreground">Favorable matchup against a weak secondary</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-red-100 dark:bg-red-900/30 p-1 rounded-full mr-2 mt-0.5">
                    <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <span className="font-medium">Bench Nick Chubb</span>
                    <p className="text-sm text-muted-foreground">Tough matchup against top-ranked run defense</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-1 rounded-full mr-2 mt-0.5">
                    <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <span className="font-medium">Consider Justin Jefferson</span>
                    <p className="text-sm text-muted-foreground">Trending up with 100+ yards in last 3 games</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Trending Players</CardTitle>
              <CardDescription>
                Hot players to consider for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full mr-2 mt-0.5">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="font-medium">Ja'Marr Chase (WR)</span>
                    <p className="text-sm text-muted-foreground">+28% ownership, 3 TDs last week</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full mr-2 mt-0.5">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="font-medium">Austin Ekeler (RB)</span>
                    <p className="text-sm text-muted-foreground">Returning from injury, expected high volume</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full mr-2 mt-0.5">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="font-medium">Dallas Cowboys (DEF)</span>
                    <p className="text-sm text-muted-foreground">Facing turnover-prone offense next week</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 