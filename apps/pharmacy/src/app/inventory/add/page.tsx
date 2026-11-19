import { Suspense } from 'react';
import { AddMedicine } from '../../../features/inventory/AddMedicine';

export default function Page() {
  return (
    <Suspense>
      <AddMedicine />
    </Suspense>
  );
}
