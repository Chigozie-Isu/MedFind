import { Suspense } from 'react';
import { Employees } from '../../../features/profile/Employees';

export default function Page() {
  return (
    <Suspense>
      <Employees />
    </Suspense>
  );
}
