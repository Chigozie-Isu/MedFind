'use client';

import { useState } from 'react';
import { SideNav, Text, ThemeToggle, pharmacyNavItems } from '@medfind/ui/web';

/** Placeholder dashboard until the real screens are built. */
export function HomeShell() {
  const [active, setActive] = useState('dashboard');
  const [live, setLive] = useState(true);
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SideNav
        items={pharmacyNavItems}
        activeKey={active}
        onNavigate={setActive}
        takingReservations={live}
        onTakingReservationsChange={setLive}
        header={<Text variant="h3">MedFind</Text>}
      />
      <main style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="h2" as="h1">
            Dashboard
          </Text>
          <ThemeToggle />
        </div>
        <Text variant="body2" color="var(--mf-text-secondary)">
          Screens are coming next.
        </Text>
      </main>
    </div>
  );
}
