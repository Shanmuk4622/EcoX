
import { Suspense } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <Suspense>{children}</Suspense>
    </div>
    );
}
