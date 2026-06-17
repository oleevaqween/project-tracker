'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { AuthCenteredShell } from '@/components/auth-centered-shell';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Za-z]/, 'Must contain a letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit({ password }: FormValues) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(
        error.message.toLowerCase().includes('session')
          ? 'Reset link expired. Please request a new one.'
          : error.message
      );
      return;
    }
    toast.success('Password updated successfully.');
    router.push('/login');
  }

  return (
    <AuthCenteredShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl shadow-black/10">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold font-heading tracking-tight leading-tight">
              Set new password
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Choose a strong password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" autoFocus {...field} />
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
                      <FormMessage />
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
                        <Input type="password" placeholder="••••••••" {...field} />
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
                  {form.formState.isSubmitting ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground pt-0">
            Link expired?&nbsp;
            <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline font-medium">
              Request a new one
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </AuthCenteredShell>
  );
}
