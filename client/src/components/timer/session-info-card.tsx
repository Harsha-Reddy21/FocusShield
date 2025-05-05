import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useLocation } from 'wouter';
import { Session, BlockedSite } from '@shared/schema';

interface SessionInfoCardProps {
  currentSession: Session | null;
  todayData: any;
  blockedSites: BlockedSite[] | undefined;
}

export default function SessionInfoCard({
  currentSession,
  todayData,
  blockedSites
}: SessionInfoCardProps) {
  const [, navigate] = useLocation();

  // Calculate formatted time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-medium text-neutral-900">Current Session</h2>
        
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <dl className="divide-y divide-neutral-200">
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-neutral-500">Session type</dt>
              <dd className="text-sm font-medium text-neutral-900">
                {currentSession 
                  ? currentSession.type === 'work'
                    ? 'Work session'
                    : currentSession.type === 'break'
                      ? 'Short break'
                      : 'Long break'
                  : 'Not started'
                }
              </dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-neutral-500">Started at</dt>
              <dd className="text-sm font-medium text-neutral-900">
                {currentSession
                  ? formatDistanceToNow(new Date(currentSession.startTime), { addSuffix: true })
                  : 'Not started'
                }
              </dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-neutral-500">Sessions completed today</dt>
              <dd className="text-sm font-medium text-neutral-900">
                {todayData?.summary?.completedSessions || 0}
              </dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-neutral-500">Total focus time today</dt>
              <dd className="text-sm font-medium text-neutral-900">
                {todayData?.summary?.totalFocusTimeMinutes || 0} minutes
              </dd>
            </div>
          </dl>
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium text-neutral-700">Distractions blocked</h3>
          <div className="mt-2 bg-neutral-100 p-3 rounded-md text-sm max-h-32 overflow-y-auto">
            {currentSession && currentSession.type === 'work' && blockedSites && blockedSites.length > 0 ? (
              <ul className="space-y-1">
                {blockedSites.map(site => (
                  <li key={site.id} className="text-neutral-700">
                    {site.domain}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500">
                {currentSession && currentSession.type === 'work'
                  ? blockedSites && blockedSites.length === 0
                    ? 'No websites in blocklist'
                    : 'No websites blocked yet in this session'
                  : currentSession
                    ? 'Websites are not blocked during breaks'
                    : 'Websites will be blocked during focus sessions'
                }
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/analytics')}
          >
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Session History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
