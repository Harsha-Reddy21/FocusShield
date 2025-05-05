import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSound } from '@/components/ui/sound';
import { TimerSettings, Session } from '@shared/schema';

interface TimerCardProps {
  className?: string;
  currentSession: Session | null;
  timerSettings?: TimerSettings;
  onSessionStart: (session: Session) => void;
  onSessionComplete: (session: Session) => void;
  onAbortRequest: () => void;
}

export default function TimerCard({
  className,
  currentSession,
  timerSettings,
  onSessionStart,
  onSessionComplete,
  onAbortRequest,
}: TimerCardProps) {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<number>(timerSettings?.workDuration || 25 * 60);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressCircleRef = useRef<SVGCircleElement>(null);
  
  // Sound effects
  const { play: playStartSound } = useSound('start');
  const { play: playCompleteSound } = useSound('complete');
  
  // Local form state for timer settings
  const [localSettings, setLocalSettings] = useState({
    workDuration: timerSettings?.workDuration || 25,
    breakDuration: timerSettings?.breakDuration || 5,
    longBreakDuration: timerSettings?.longBreakDuration || 15,
  });
  
  // Update local settings when timerSettings prop changes
  useEffect(() => {
    if (timerSettings) {
      setLocalSettings({
        workDuration: timerSettings.workDuration,
        breakDuration: timerSettings.breakDuration,
        longBreakDuration: timerSettings.longBreakDuration,
      });
      
      // Only update timeLeft if the timer is not active
      if (!timerActive && !currentSession) {
        setTimeLeft(timerSettings.workDuration * 60);
      }
    }
  }, [timerSettings, timerActive, currentSession]);
  
  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest('POST', '/api/sessions', {
        startTime: new Date().toISOString(),
        type,
      });
      return await res.json();
    },
    onSuccess: (session: Session) => {
      onSessionStart(session);
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/today'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start session',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest('PUT', `/api/sessions/${id}`, data);
      return await res.json();
    },
    onSuccess: (session: Session) => {
      if (session.completed) {
        if (timerSettings?.soundEnabled) {
          playCompleteSound();
        }
        onSessionComplete(session);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/today'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update session',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Timer functionality
  useEffect(() => {
    if (timerActive && currentSession) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTimeLeft) => {
          if (prevTimeLeft <= 1) {
            // Timer finished
            clearInterval(timerRef.current!);
            
            // Mark the session as completed
            if (currentSession.id) {
              updateSessionMutation.mutate({
                id: currentSession.id,
                data: {
                  endTime: new Date().toISOString(),
                  duration: calculateSessionDuration(currentSession.type),
                  completed: true,
                }
              });
            }
            
            setTimerActive(false);
            return 0;
          }
          
          return prevTimeLeft - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, currentSession]);
  
  // Update progress circle
  useEffect(() => {
    if (progressCircleRef.current && currentSession) {
      const totalDuration = calculateSessionDuration(currentSession.type);
      const dashOffset = 283 - (timeLeft / totalDuration) * 283;
      progressCircleRef.current.style.strokeDashoffset = `${dashOffset}`;
    }
  }, [timeLeft, currentSession]);
  
  // Calculate session duration in seconds based on type
  const calculateSessionDuration = (type: string): number => {
    switch (type) {
      case 'work':
        return localSettings.workDuration * 60;
      case 'break':
        return localSettings.breakDuration * 60;
      case 'long-break':
        return localSettings.longBreakDuration * 60;
      default:
        return 25 * 60;
    }
  };
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Handle timer start
  const handleStartTimer = () => {
    if (timerActive) {
      // Pause the timer
      setTimerActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } else if (currentSession) {
      // Resume the timer
      setTimerActive(true);
    } else {
      // Start a new work session
      setTimeLeft(localSettings.workDuration * 60);
      setTimerActive(true);
      if (timerSettings?.soundEnabled) {
        playStartSound();
      }
      createSessionMutation.mutate('work');
    }
  };
  
  // Handle skip button
  const handleSkip = () => {
    if (currentSession && currentSession.id) {
      updateSessionMutation.mutate({
        id: currentSession.id,
        data: {
          endTime: new Date().toISOString(),
          duration: calculateSessionDuration(currentSession.type) - timeLeft,
          completed: true,
        }
      });
    }
    
    setTimeLeft(0);
    setTimerActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
  
  // Handle settings change
  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    
    if (!isNaN(numValue)) {
      setLocalSettings(prev => ({
        ...prev,
        [name]: numValue
      }));
      
      // If timer is not active, update the time left for work duration
      if (!timerActive && !currentSession && name === 'workDuration') {
        setTimeLeft(numValue * 60);
      }
    }
  };
  
  // Get session status text
  const getSessionStatus = (): string => {
    if (!currentSession) {
      return 'Ready to focus';
    }
    
    if (!timerActive) {
      return 'Paused';
    }
    
    switch (currentSession.type) {
      case 'work':
        return 'Focus in progress';
      case 'break':
        return 'Taking a short break';
      case 'long-break':
        return 'Taking a long break';
      default:
        return 'Timer active';
    }
  };
  
  // Get session info text
  const getSessionInfo = (): string => {
    if (!currentSession) {
      return `Work session • ${localSettings.workDuration} minutes`;
    }
    
    switch (currentSession.type) {
      case 'work':
        return `Work session • ${localSettings.workDuration} minutes`;
      case 'break':
        return `Break • ${localSettings.breakDuration} minutes`;
      case 'long-break':
        return `Long break • ${localSettings.longBreakDuration} minutes`;
      default:
        return 'Timer session';
    }
  };
  
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          {/* Timer Display */}
          <div className="relative mt-4">
            <svg className="w-64 h-64" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle 
                className="text-neutral-200" 
                strokeWidth="4" 
                stroke="currentColor" 
                fill="transparent" 
                r="45" 
                cx="50" 
                cy="50"
              />
              {/* Progress circle */}
              <circle 
                ref={progressCircleRef}
                className={`${currentSession?.type === 'work' ? 'text-accent' : 'text-secondary'}`}
                strokeWidth="4" 
                stroke="currentColor" 
                fill="transparent" 
                r="45" 
                cx="50" 
                cy="50"
                style={{
                  strokeDasharray: 283,
                  strokeDashoffset: 0,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-mono font-medium">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          
          {/* Timer Status */}
          <div className="mt-4 text-center">
            <p className="text-lg font-medium text-neutral-700">
              {getSessionStatus()}
            </p>
            <p className="text-sm text-neutral-500">
              {getSessionInfo()}
            </p>
          </div>
          
          {/* Timer Controls */}
          <div className="mt-8 flex space-x-4">
            <Button
              onClick={handleStartTimer}
              className={timerActive ? "bg-primary-light text-primary hover:bg-primary-light/80" : ""}
              variant={timerActive ? "outline" : "default"}
            >
              {!currentSession
                ? "Start Focus Session"
                : timerActive
                  ? "Pause Session"
                  : "Resume Session"}
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="text-primary bg-primary-light hover:bg-primary-light/80"
              disabled={!currentSession}
            >
              Skip
            </Button>
            <Button
              onClick={onAbortRequest}
              variant="outline"
              className="text-error border-error hover:bg-red-50"
              disabled={!currentSession}
            >
              Abort
            </Button>
          </div>
        </div>
        
        {/* Session Configuration (only shown when not in an active session) */}
        {!currentSession && (
          <div className="mt-8 border-t border-neutral-200 pt-6">
            <h3 className="text-lg font-medium text-neutral-900">Session Settings</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="workDuration" className="block text-sm font-medium text-neutral-700">
                  Work Duration
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <Input
                    type="number"
                    name="workDuration"
                    id="workDuration"
                    value={localSettings.workDuration}
                    onChange={handleSettingChange}
                    min={1}
                    max={60}
                    className="flex-1 block w-full rounded-none rounded-l-md sm:text-sm"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-neutral-300 bg-neutral-50 text-neutral-500 text-sm">
                    minutes
                  </span>
                </div>
              </div>
              <div>
                <label htmlFor="breakDuration" className="block text-sm font-medium text-neutral-700">
                  Break Duration
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <Input
                    type="number"
                    name="breakDuration"
                    id="breakDuration"
                    value={localSettings.breakDuration}
                    onChange={handleSettingChange}
                    min={1}
                    max={30}
                    className="flex-1 block w-full rounded-none rounded-l-md sm:text-sm"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-neutral-300 bg-neutral-50 text-neutral-500 text-sm">
                    minutes
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="longBreakDuration" className="block text-sm font-medium text-neutral-700">
                Long Break Duration (every {timerSettings?.sessionsBeforeLongBreak || 4} sessions)
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <Input
                  type="number"
                  name="longBreakDuration"
                  id="longBreakDuration"
                  value={localSettings.longBreakDuration}
                  onChange={handleSettingChange}
                  min={5}
                  max={60}
                  className="flex-1 block w-full rounded-none rounded-l-md sm:text-sm"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-neutral-300 bg-neutral-50 text-neutral-500 text-sm">
                  minutes
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
