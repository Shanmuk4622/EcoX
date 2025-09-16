
import { Suspense } from 'react';
import { DashboardComponent } from '@/components/dashboard-component';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardComponent />
    </Suspense>
  );
}
