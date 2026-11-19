'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { myStaffState, supabase, type StaffState } from '../lib/supabase';
import { HomeShell } from './HomeShell';

/**
 * Signed-out visitors go to the Splash; an owner with a draft application goes back to sign up.
 * Everyone else sees the dashboard (in "waiting for approval" mode until MedFind approves).
 */
export default function Home() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffState | null | undefined>(undefined);
  useEffect(() => {
    (async () => {
      if (!supabase) return setStaff(null);
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.replace('/welcome');
      const s = await myStaffState();
      if (!s) return router.replace('/welcome');
      if (s.application_status === 'draft') return router.replace('/sign-up');
      setStaff(s);
    })();
  }, [router]);
  if (staff === undefined) return null;
  return (
    <HomeShell
      staff={staff}
      onSignOut={async () => {
        await supabase?.auth.signOut();
        router.replace('/welcome');
      }}
    />
  );
}
