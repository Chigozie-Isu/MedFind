import { Suspense } from 'react';
import { ReviewRoute } from '../../../features/reservations/Review';

export default function Page() {
  return (
    <Suspense>
      <ReviewRoute />
    </Suspense>
  );
}
