import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import OnboardingForm from './onboarding-form';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [existingProfile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (existingProfile) redirect('/dashboard');

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">One last step</h1>
        <p className="text-muted-foreground">
          Choose a username for your public portfolio URL
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
