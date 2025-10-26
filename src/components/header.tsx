
import { UserNav } from '@/components/user-nav';
import { SidebarTrigger } from './ui/sidebar';
import { Shield } from 'lucide-react';

export function Header() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
      <SidebarTrigger className="h-8 w-8 md:hidden" />
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">ExoX</h1>
      </div>
      <div className="ml-auto">
        <UserNav />
      </div>
    </header>
  );
}
