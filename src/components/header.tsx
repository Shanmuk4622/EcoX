
import { UserAuthButton } from '@/components/user-auth-button';

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
       <h1 className="text-xl font-bold">Real-Time CO2 Monitor</h1>
      <UserAuthButton />
    </header>
  );
}
