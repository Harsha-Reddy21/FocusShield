import { useLocation } from 'wouter';
import { Clock, Ban, BarChart2, Settings } from 'lucide-react';

export default function MobileNav() {
  const [location, navigate] = useLocation();
  
  const navigation = [
    {
      name: 'Timer',
      href: '/',
      icon: Clock,
      current: location === '/',
    },
    {
      name: 'Block',
      href: '/blocklist',
      icon: Ban,
      current: location === '/blocklist',
    },
    {
      name: 'Stats',
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
    <div className="md:hidden mobile-nav">
      {navigation.map((item) => (
        <button
          key={item.name}
          onClick={() => navigate(item.href)}
          className={`${
            item.current ? 'text-primary' : 'text-neutral-500'
          } flex flex-col items-center justify-center`}
        >
          <item.icon className="w-6 h-6" />
          <span className="text-xs mt-1">{item.name}</span>
        </button>
      ))}
    </div>
  );
}
