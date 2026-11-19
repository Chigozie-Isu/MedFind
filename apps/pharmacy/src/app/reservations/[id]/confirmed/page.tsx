import { Suspense } from 'react';
import { ConfirmedRoute } from '../../../../features/reservations/Confirmed';

export default function Page() {
  return (
    <Suspense>
      <ConfirmedRoute />
    </Suspense>
  );
}
