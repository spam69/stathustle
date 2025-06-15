import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Trophy, Loader2, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";

// Schemas for team creation and joining
const createTeamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters").max(50, "Team name must be less than 50 characters"),
  description: z.string().optional(),
  sport: z.string().min(1, "Please select a sport"),
  logo: z.string().optional(),
});

type CreateTeamValues = z.infer<typeof createTeamSchema>;

// Available sports
const SPORTS = [
  { id: "football", label: "Football", icon: "🏈" },
  { id: "basketball", label: "Basketball", icon: "🏀" },
  { id: "baseball", label: "Baseball", icon: "⚾" },
  { id: "hockey", label: "Hockey", icon: "🏒" },
  { id: "soccer", label: "Soccer", icon: "⚽" }
];

export function CreateTeamDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      sport: "",
      logo: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateTeamValues) => {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          platform: "Yahoo",
          members: 1,
          commissioner: user?.username || "You",
          teams: 1,
          nextDraft: "TBD",
          logo: "/league-logos/default.jpg",
          status: "active"
        })
      });
      if (!res.ok) throw new Error("Failed to create league");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leagues'] });
      toast({ title: "League Created", description: "Your league has been created." });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm">
          <Plus className="mr-1 sm:mr-2 h-3 sm:h-4 w-3 sm:w-4" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a new fantasy team to join leagues and compete with others.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your team name..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your team..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sport</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sport" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SPORTS.map(sport => (
                          <SelectItem key={sport.id} value={sport.id}>
                            <span className="flex items-center">
                              <span className="mr-2">{sport.icon}</span>
                              {sport.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a URL for your team logo..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={mutation.status === 'pending'}>
                {mutation.status === 'pending' ? "Creating..." : "Create Team"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}