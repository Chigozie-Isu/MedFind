'use client';

import { useState } from 'react';
import { canGoLive } from '@medfind/core';
import { Button, CalloutCard, SideNav, Text, ThemeToggle, pharmacyNavItems } from '@medfind/ui/web';
import type { StaffState } from '../lib/supabase';

/** Placeholder dashboard until the real screens are built. */
export function HomeShell({ staff, onSignOut }: { staff: StaffState | null; onSignOut: () => void }) {
  const [active, setActive] = useState('dashboard');
  const approved = staff ? canGoLive(staff.application_status) : true;
  const [live, setLive] = useState(approved);
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SideNav
        items={pharmacyNavItems}
        activeKey={active}
        onNavigate={setActive}
        takingReservations={live}
        onTakingReservationsChange={(v) => approved && setLive(v)}
        header={<Text variant="h3">{staff?.pharmacy_name ?? 'MedFind'}</Text>}
      />
      <main style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <Text variant="h2" as="h1">
            Dashboard
          </Text>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <ThemeToggle />
            <Button label="Sign out" variant="inline" size="medium" onPress={onSignOut} />
          </div>
        </div>
        {!approved && (
          <CalloutCard
            icon="shield"
            title={staff?.application_status === 'rejected' ? 'Your application needs changes' : 'We’re checking your application'}
            body={
              staff?.application_status === 'rejected'
                ? 'We’ve emailed you what to fix. Chat with us if you have questions.'
                : 'Most pharmacies are approved within 24 hours. You can add stock and set your opening hours, but patients can’t reserve from you yet.'
            }
          />
        )}
        <Text variant="body2" color="var(--mf-text-secondary)">
          Screens are coming next.
        </Text>
      </main>
    </div>
  );
}
