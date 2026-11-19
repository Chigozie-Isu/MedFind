import { Suspense } from 'react';
import { Inventory } from '../../features/inventory/Inventory';

export default function Page() {
  return (
    <Suspense>
      <Inventory />
    </Suspense>
  );
}
