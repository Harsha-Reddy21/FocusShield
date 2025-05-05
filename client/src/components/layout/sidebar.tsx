import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Clock, Ban, BarChart2, Settings, User } from 'lucide-react';

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const navigation = [
    {
      name: 'Timer',
      href: '/',
      icon: Clock,
      current: location === '/',
    },
    {
      name: 'Blocklist',
      href: '/blocklist',
      icon: Ban,
      current: location === '/blocklist',
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart2,
      current: location === '/analytics',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: location === '/settings',
    },
  ];
  
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-neutral-200 bg-white">
        <div className="h-16 flex items-center border-b border-neutral-200 px-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-primary" />
            <span className="ml-2 text-lg font-semibold text-primary">FocusFlow</span>
          </div>
        </div>
        
        <div className="flex-grow flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 px-2 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  item.current
                    ? 'bg-primary-light text-primary'
                    : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                }`}
              >
                <item.icon
                  className="mr-3 h-5 w-5"
                  aria-hidden="true"
                />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-neutral-200 p-4">
          <div className="flex items-center">
            <div>
              <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-700">{user?.name || 'User'}</p>
              <button 
                onClick={() => logoutMutation.mutate()}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
