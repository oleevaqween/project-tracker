'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { createClient } from '@/lib/supabase/client';
import { verifyTurnstile } from '@/actions/turnstile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { QuotePanel } from '@/components/quote-panel';

const signupSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cfToken, setCfToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit({ email, password }: SignupValues) {
    if (!cfToken) {
      toast.error('Please complete the human verification.');
      return;
    }
    setLoading(true);

    const verified = await verifyTurnstile(cfToken);
    if (!verified) {
      toast.error('Verification failed. Please try again.');
      setCfToken(null);
      turnstileRef.current?.reset();
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      toast.error(error.message);
      setCfToken(null);
      turnstileRef.current?.reset();
      setLoading(false);
      return;
    }

    toast.success('Check your email to confirm your account.');
    router.push('/login');
  }

  async function signUpWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/4 blur-3xl" />
      </div>

      {/* Brand mark */}
      <div className="absolute top-6 left-6">
        <div className="flex size-8 items-center justify-center rounded-lg overflow-hidden">
          <Image src="/logo2.png" width={32} height={32} alt="Project Tracker" />
        </div>
      </div>

      {/* Theme toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Two-column card */}
      <div className="relative z-10 w-full max-w-[44rem]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/10 overflow-hidden flex flex-row p-0 w-full">

            {/* Left column: signup form */}
            <div className="flex flex-col flex-1 min-w-0">
              <CardHeader className="space-y-1 pb-4 px-6 pt-6">
                <CardTitle className="text-2xl font-bold font-heading tracking-tight leading-tight">
                  Create an account
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Become a better PM
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-4 space-y-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                          </FormControl>
                          {fieldState.isTouched && (
                            <ul className="mt-1.5 space-y-1">
                              {[
                                { label: 'At least 8 characters', pass: field.value.length >= 8 },
                                { label: 'Contains a letter', pass: /[A-Za-z]/.test(field.value) },
                                { label: 'Contains a number', pass: /[0-9]/.test(field.value) },
                              ].map(({ label, pass }) => (
                                <li
                                  key={label}
                                  className={`flex items-center gap-1.5 text-xs ${pass ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}
                                >
                                  <span aria-hidden="true">{pass ? '✓' : '✗'}</span>
                                  <span>{label}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Cloudflare Turnstile */}
                    <div className="pt-1">
                      <Turnstile
                        ref={turnstileRef}
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'}
                        onSuccess={setCfToken}
                        onError={() => setCfToken(null)}
                        onExpire={() => setCfToken(null)}
                        options={{ theme: 'auto', size: 'flexible' }}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full shadow-lg shadow-primary/20"
                      disabled={loading || !cfToken}
                    >
                      {loading ? 'Creating account…' : 'Create account'}
                    </Button>
                  </form>
                </Form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-border/60 hover:border-border"
                  type="button"
                  onClick={signUpWithGoogle}
                >
                  <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>
              </CardContent>

              <CardFooter className="px-6 pb-6 justify-center text-sm text-muted-foreground pt-0">
                Already have an account?&nbsp;
                <Link href="/login" className="text-primary underline-offset-4 hover:underline font-medium">
                  Sign in
                </Link>
              </CardFooter>
            </div>

            {/* Right column: quotes, hidden on small screens */}
            <div className="hidden lg:flex lg:w-[42%] flex-shrink-0">
              <QuotePanel />
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
