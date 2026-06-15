'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { updateProfile, deleteAccount } from '@/actions/profile';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProfileClientProps {
  profile: {
    username: string;
    displayName: string;
    bio: string;
    createdAt: Date;
  };
  email: string;
  provider: string;
}

const identitySchema = z.object({
  displayName: z.string().max(255, 'Max 255 characters'),
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(50, 'Max 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  bio: z.string().max(500, 'Max 500 characters'),
});
type IdentityValues = z.infer<typeof identitySchema>;

const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Za-z]/, 'Must contain a letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        {title}
      </p>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}

export function ProfileClient({ profile, email, provider }: ProfileClientProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isEmailUser = provider === 'email';
  const initial = profile.username[0]?.toUpperCase() ?? 'U';

  const providerLabel: Record<string, string> = {
    google: 'Google',
    email: 'Email & password',
  };

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const identityForm = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      displayName: profile.displayName,
      username: profile.username,
      bio: profile.bio,
    },
  });

  async function onIdentitySubmit(values: IdentityValues) {
    const result = await updateProfile(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Profile updated.');
  }

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    mode: 'onBlur',
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  async function onPasswordSubmit({ newPassword }: PasswordValues) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Password updated.');
    passwordForm.reset();
  }

  async function handleDelete() {
    if (deleteConfirm !== profile.username) return;
    setDeleting(true);
    try {
      await deleteAccount();
    } catch {
      toast.error('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <Avatar className="size-14 rounded-xl shrink-0">
          <AvatarFallback className="rounded-xl text-xl font-bold bg-primary text-primary-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold font-heading text-lg leading-tight">@{profile.username}</p>
          <p className="text-sm text-muted-foreground">Member since {memberSince}</p>
        </div>
      </div>

      <section>
        <SectionHeading title="Identity" />
        <Form {...identityForm}>
          <form onSubmit={identityForm.handleSubmit(onIdentitySubmit)} className="space-y-4">
            <FormField
              control={identityForm.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={identityForm.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground select-none">
                        @
                      </span>
                      <Input className="rounded-l-none" placeholder="username" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={identityForm.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A short bio about yourself…"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={identityForm.formState.isSubmitting}
              className="shadow-lg shadow-primary/20"
            >
              {identityForm.formState.isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Form>
      </section>

      <section>
        <SectionHeading title="Account" />
        <dl className="space-y-3">
          {[
            { label: 'Email', value: email },
            { label: 'Auth method', value: providerLabel[provider] ?? 'Email & password' },
            { label: 'Member since', value: memberSince },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium text-right">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {isEmailUser && (
        <section>
          <SectionHeading title="Security" />
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
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
                            className={`flex items-center gap-1.5 text-xs ${
                              pass ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                            }`}
                          >
                            <span>{pass ? '✓' : '✗'}</span>
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
                control={passwordForm.control}
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
                variant="outline"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </Form>
        </section>
      )}

      <section>
        <SectionHeading title="Danger Zone" />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently removes your account and all project data. This cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="shrink-0"
          >
            Delete account
          </Button>
        </div>
      </section>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteConfirm(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, all projects, tasks, risks, documents, and chat
              history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-semibold text-foreground">{profile.username}</span> to
              confirm.
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={profile.username}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirm !== profile.username || deleting}
            >
              {deleting ? 'Deleting…' : 'Yes, delete my account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
