import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const createLeagueSchema = z.object({
  name: z.string().min(2, "League name must be at least 2 characters"),
  platform: z.string().min(1, "Platform is required"),
  sport: z.string().min(1, "Sport is required"),
  capacity: z.string().min(1, "Number of teams is required"),
  description: z.string().optional(),
});

const joinLeagueSchema = z.object({
  leagueCode: z.string().min(4, "League code must be at least 4 characters"),
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
});

type CreateLeagueValues = z.infer<typeof createLeagueSchema>;
type JoinLeagueValues = z.infer<typeof joinLeagueSchema>;

interface AddLeagueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLeagueDialog({ open, onOpenChange }: AddLeagueDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  
  // Create League Form
  const createLeagueForm = useForm<CreateLeagueValues>({
    resolver: zodResolver(createLeagueSchema),
    defaultValues: {
      name: "",
      platform: "Yahoo",
      sport: "football",
      capacity: "10",
      description: "",
    },
  });

  // Join League Form
  const joinLeagueForm = useForm<JoinLeagueValues>({
    resolver: zodResolver(joinLeagueSchema),
    defaultValues: {
      leagueCode: "",
      teamName: "",
    },
  });

  // Create League Mutation
  const createLeagueMutation = useMutation({
    mutationFn: async (data: CreateLeagueValues) => {
      const response = await apiRequest("POST", "/api/leagues", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "League created successfully",
        description: "Your fantasy league has been created and added to your dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leagues'] });
      createLeagueForm.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create league",
        description: error.message || "There was an error creating your league. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Join League Mutation
  const joinLeagueMutation = useMutation({
    mutationFn: async (data: JoinLeagueValues) => {
      const response = await apiRequest("POST", "/api/leagues/join", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Joined league successfully",
        description: "You have successfully joined the fantasy league.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leagues'] });
      joinLeagueForm.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join league",
        description: error.message || "There was an error joining the league. Please check the league code and try again.",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: CreateLeagueValues) => {
    createLeagueMutation.mutate(data);
  };

  const onJoinSubmit = (data: JoinLeagueValues) => {
    joinLeagueMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Fantasy League</DialogTitle>
          <DialogDescription>
            Join an existing league or create your own fantasy sports league.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="join" value={activeTab} onValueChange={(value) => setActiveTab(value as "join" | "create")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="join">Join League</TabsTrigger>
            <TabsTrigger value="create">Create League</TabsTrigger>
          </TabsList>
          
          <TabsContent value="join">
            <Form {...joinLeagueForm}>
              <form onSubmit={joinLeagueForm.handleSubmit(onJoinSubmit)} className="space-y-4">
                <FormField
                  control={joinLeagueForm.control}
                  name="leagueCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>League Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter league code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={joinLeagueForm.control}
                  name="teamName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Team Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your team name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    disabled={joinLeagueMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={joinLeagueMutation.isPending}>
                    {joinLeagueMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Join League
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="create">
            <Form {...createLeagueForm}>
              <form onSubmit={createLeagueForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createLeagueForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>League Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Dynasty Football League" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createLeagueForm.control}
                    name="sport"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sport</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sport" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="football">Football (NFL)</SelectItem>
                            <SelectItem value="basketball">Basketball (NBA)</SelectItem>
                            <SelectItem value="baseball">Baseball (MLB)</SelectItem>
                            <SelectItem value="hockey">Hockey (NHL)</SelectItem>
                            <SelectItem value="soccer">Soccer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createLeagueForm.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Yahoo">Yahoo</SelectItem>
                            <SelectItem value="ESPN">ESPN</SelectItem>
                            <SelectItem value="Sleeper">Sleeper</SelectItem>
                            <SelectItem value="NFL.com">NFL.com</SelectItem>
                            <SelectItem value="CBS">CBS</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={createLeagueForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Teams</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="8">8 Teams</SelectItem>
                          <SelectItem value="10">10 Teams</SelectItem>
                          <SelectItem value="12">12 Teams</SelectItem>
                          <SelectItem value="14">14 Teams</SelectItem>
                          <SelectItem value="16">16 Teams</SelectItem>
                          <SelectItem value="20">20 Teams</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createLeagueForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add a description, rules, or other information about your league"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    disabled={createLeagueMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLeagueMutation.isPending}>
                    {createLeagueMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create League
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}