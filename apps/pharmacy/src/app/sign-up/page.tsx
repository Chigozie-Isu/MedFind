'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { SignUpWizard } from '../../features/signup/SignUpWizard';

export default function SignUpPage() {
  const router = useRouter();
  return <SignUpWizard onDashboard={() => router.replace(supabase ? '/' : '/dashboard')} />;
}
