
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from '@/contexts/auth-context'; // Import useAuth from your context
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, { message: "Email or Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth(); // Get login function from context
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const loggedInUser = await login({ 
        emailOrUsername: data.emailOrUsername, 
        password: data.password 
      });

      if (loggedInUser) {
        toast({ title: "Login Successful", description: `Welcome back, ${loggedInUser.username}!`});
        await queryClient.invalidateQueries({ queryKey: ['posts'] }); // Invalidate posts to refetch potentially user-specific data
        // No need to invalidate session query as we are not using NextAuth sessions
        router.push('/');
        router.refresh(); 
      } else {
        toast({ title: "Login Failed", description: "Invalid email/username or password.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("LoginPage: Error during login:", error);
      toast({ title: "Login Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-headline">Login to StatHustle</CardTitle>
        <CardDescription>Enter your email or username below to login</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="emailOrUsername"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel htmlFor="emailOrUsername">Email or Username</FormLabel>
                  <FormControl>
                    <Input id="emailOrUsername" placeholder="m@example.com or username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <div className="flex items-center">
                    <FormLabel htmlFor="password">Password</FormLabel>
                  </div>
                  <FormControl>
                    <Input id="password" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
