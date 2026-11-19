'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon, Text } from '@medfind/ui/web';
import { SignInFlow } from '../../features/auth/SignInFlow';
import { supabase } from '../../lib/supabase';
import { getWorkspace } from '../../features/workspace/store';
import c from '../../features/common/common.module.css';

/** "Clock out – shift ended" (Figma 2482:82168): the sign-in page with a shift summary on top. */
function ShiftEnded() {
  const ended = useSearchParams().get('ended');
  const [open, setOpen] = useState(true);
  if (!ended || !open) return null;
  const [worked, fulfilled, declined, edits] = ended.split('|');
  return (
    <div className={c.banner} data-tone="success" role="status" style={{ position: 'fixed', top: 24, left: '14%', right: '14%', zIndex: 60 }}>
      <Icon name="tick-circle" size={28} />
      <div className={c.bannerText}>
        <Text variant="h5">Shift ended · {getWorkspace().staffName}</Text>
        <Text variant="caption1">
          You worked {worked}: {fulfilled} reservations fulfilled, {declined} declined, {edits} stock edits. You’re signed out of this device.
        </Text>
      </div>
      <button type="button" className={c.iconBtn} onClick={() => setOpen(false)} aria-label="Close">
        <Icon name="close" size={20} />
      </button>
    </div>
  );
}

export default function SignInPage() {
  const router = useRouter();
  return (
    <>
      <Suspense>
        <ShiftEnded />
      </Suspense>
      <SignInFlow
        onSignedIn={(outcome) => router.replace(outcome === 'resume_sign_up' ? '/sign-up' : supabase ? '/' : '/dashboard')}
        onForgotPassword={() => router.push('/forgot-password')}
      />
    </>
  );
}
