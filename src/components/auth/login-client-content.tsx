
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from '@/components/shared/container';
import { PageHeader } from '@/components/shared/page-header';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'; // Added Loader2
import { useAuth } from '@/components/layout/app-providers';
import { APP_NAME } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function LoginClientContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { session, isLoadingAuth, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); // useSearchParams is now safe here
  const { toast } = useToast();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (isLoadingAuth) {
      return; 
    }

    if (session) { 
      const redirectTo = searchParams.get('redirectTo');
      if (redirectTo && redirectTo !== '/login' && redirectTo !== '/signup') {
        router.push(redirectTo);
      } else if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/profile');
      }
    }
  }, [session, router, searchParams, isLoadingAuth, isAdmin]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Login Successful!", description: "Redirecting..." });
      // Redirection is handled by the useEffect above reacting to session changes
    }
    setIsSubmitting(false);
  };

  // This loading state is for the auth check within this component
  if (isLoadingAuth) {
    return (
      <Container className="py-12 md:py-20 flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <PageHeader title="Loading..." description="Verifying authentication..." />
        </div>
      </Container>
    );
  }
  
  // If session is loaded and exists, useEffect will redirect, so this UI might flash briefly or not show.
  // If still on login page and isLoadingAuth is false, it means no session.

  return (
    <Container className="py-12 md:py-20 flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>Log in to your {APP_NAME} account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="text-xs text-primary hover:underline"
                  onClick={(e) => {e.preventDefault(); toast({ title: "Feature Coming Soon", description: "Password recovery is not yet implemented."});}}
                  title="Forgot password functionality not yet implemented"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background pr-10"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground w-full">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </Container>
  );
}
