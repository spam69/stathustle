
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/auth-context';
import type { SportInterest, SportInterestLevel } from '@/types';
import { availableSports, sportInterestLevels } from '@/lib/mock-data';
// Toast is now handled by AuthContext

const signupSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  sportInterests: z.array(z.object({
    sport: z.string(),
    level: z.enum(['very interested', 'somewhat interested', 'no interest']),
  })).optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthActionLoading } = useAuth();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      sportInterests: availableSports.map(sport => ({ sport, level: 'no interest' })),
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    const interests = data.sportInterests?.filter(interest => interest.level !== 'no interest') as SportInterest[];
    
    const signedUpUser = await signup({
      username: data.username,
      email: data.email,
      password: data.password, // Password sent to API
      sportInterests: interests,
    });

    if (signedUpUser) {
      router.push('/');
    }
    // Error toast is handled by AuthContext's useMutation
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
        <CardDescription>Enter your information to get started with StatHustle.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel htmlFor="username">Username (@)</FormLabel>
                  <FormControl>
                    <Input id="username" placeholder="your_username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input id="email" type="email" placeholder="m@example.com" {...field} />
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
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <FormControl>
                    <Input id="password" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel className="font-headline">Sport Interests</FormLabel>
              <p className="text-sm text-muted-foreground">Select your level of interest for each sport.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-1">
                {availableSports.map((sport, index) => (
                  <FormField
                    key={sport}
                    control={form.control}
                    name={`sportInterests.${index}.level`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{sport}</FormLabel>
                        <input type="hidden" {...form.register(`sportInterests.${index}.sport`)} value={sport} />
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select interest" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sportInterestLevels.map(level => (
                              <SelectItem key={level} value={level}>
                                {level.charAt(0).toUpperCase() + level.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isAuthActionLoading}>
              {isAuthActionLoading ? 'Signing up...' : 'Sign Up'}
            </Button>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    