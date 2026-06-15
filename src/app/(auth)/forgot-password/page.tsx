'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

function ForgotPasswordContent() {
  const [sent, setSent] = useState(false);
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get('error') === 'link_expired';

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit({ email }: FormValues) {
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-callback`,
    });
    setSent(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/10">
        {sent ? (
          <>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold font-heading tracking-tight leading-tight">
                Check your email
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                If that address has an account, a password reset link is on its way from{' '}
                <span className="font-medium text-foreground">projectracker@projects.aboveone.net</span>.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center text-sm text-muted-foreground pt-0">
              <Link href="/login" className="text-primary underline-offset-4 hover:underline font-medium">
                Back to sign in
              </Link>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold font-heading tracking-tight leading-tight">
                Forgot password?
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {linkExpired
                  ? 'That link has expired. Enter your email to receive a new one.'
                  : "Enter your email to receive a magic link. Once signed in, update your password in settings."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" autoFocus {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full shadow-lg shadow-primary/20"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? 'Sending…' : 'Send magic link'}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="justify-center text-sm text-muted-foreground pt-0">
              Remembered it?&nbsp;
              <Link href="/login" className="text-primary underline-offset-4 hover:underline font-medium">
                Sign in
              </Link>
            </CardFooter>
          </>
        )}
      </Card>
    </motion.div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}
