'use client';

import { useActionState } from 'react';
import { createProfile } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OnboardingForm() {
  const [state, action, pending] = useActionState(createProfile, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose your username</CardTitle>
        <CardDescription>
          Your portfolio will be visible at{' '}
          <span className="font-mono text-primary">/portfolio/your-username</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="your-username"
              pattern="[a-zA-Z0-9_\-]+"
              minLength={3}
              maxLength={50}
              required
              autoFocus
            />
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              3–50 characters. Letters, numbers, hyphens, and underscores only.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Setting up your account…' : 'Continue to Dashboard'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}