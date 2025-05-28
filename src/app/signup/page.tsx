
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/app-providers';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { session, supabase } = useAuth();

  useEffect(() => {
    if (session) {
      // If user is already signed in, redirect them (e.g., to profile)
      router.push('/profile');
    }
  }, [session, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    // Construct emailRedirectTo using window.location.origin for client-side context
    const emailRedirectTo = `${window.location.origin}/auth/callback`; // Standard Supabase callback path

    const { data: signUpResponse, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, // Supabase stores this in raw_user_meta_data
        },
        emailRedirectTo: emailRedirectTo,
      },
    });

    if (error) {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    } else if (signUpResponse.user && signUpResponse.user.identities && signUpResponse.user.identities.length === 0) {
      // This condition often means email confirmation is required but user already exists (unconfirmed)
      // Supabase might not throw an error but returns a user with no identities if "Confirm email" is ON and user exists
      toast({
        title: "Signup Issue",
        description: "User may already exist or requires email confirmation. If you've signed up before, please check your email for a confirmation link or try logging in.",
        variant: "default",
        duration: 7000,
      });
       router.push('/login?message=check_email_or_login');
    }
     else if (signUpResponse.user) {
      toast({
        title: "Account Created!",
        description: "Please check your email to confirm your account.",
      });
      console.log("SIGNUP SUCCESS: A new user record has been created in auth.users.");
      console.warn("IMPORTANT: You need to set up a Supabase Database Function (trigger) on auth.users INSERT to automatically create a corresponding record in your public.profiles table, copying over the user's ID, email, and full_name (from raw_user_meta_data), and setting is_admin to false by default.");
      router.push('/login?message=signup_success_check_email');
    } else {
        // Fallback for unexpected response
        toast({ title: "Signup Issue", description: "An unexpected issue occurred during signup. Please try again.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  if (session && !isLoading) {
    return (
        <Container className="py-12 md:py-20 flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <PageHeader title="Already Logged In" description="Redirecting..." />
        </Container>
    );
  }

  return (
    <Container className="py-12 md:py-20 flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Join {APP_NAME} to stay informed and contribute.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-background"
                autoComplete="name"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
               <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="•••••••• (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background pr-10"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                 <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background pr-10"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground w-full">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </Container>
  );
}
