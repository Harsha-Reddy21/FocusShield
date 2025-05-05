import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Session } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface SessionCompleteModalProps {
  isOpen: boolean;
  onStartBreak: () => void;
  onSkipBreak: () => void;
  session: Session | null;
}

export default function SessionCompleteModal({
  isOpen,
  onStartBreak,
  onSkipBreak,
  session,
}: SessionCompleteModalProps) {
  // Create session mutation (for break)
  const createSessionMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest('POST', '/api/sessions', {
        startTime: new Date().toISOString(),
        type,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/today'] });
      onStartBreak();
    },
  });
  
  const handleStartBreak = () => {
    createSessionMutation.mutate('break');
  };
  
  const handleSkipBreak = () => {
    onSkipBreak();
  };
  
  if (!session) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onSkipBreak()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center mt-4">Focus Session Complete!</DialogTitle>
          <DialogDescription className="text-center">
            Great job! You've completed a focus session. Time for a break.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 bg-neutral-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-neutral-700">Session Summary</h4>
          <dl className="mt-2 divide-y divide-neutral-200">
            <div className="py-2 flex justify-between">
              <dt className="text-sm text-neutral-500">Duration</dt>
              <dd className="text-sm font-medium text-neutral-900">
                {session.type === 'work' ? '25' : session.type === 'break' ? '5' : '15'} minutes
              </dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-sm text-neutral-500">Focus score</dt>
              <dd className="text-sm font-medium text-neutral-900">100%</dd>
            </div>
          </dl>
        </div>
        
        <DialogFooter className="sm:justify-between sm:space-x-4 mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkipBreak}
            className="sm:w-full"
          >
            Skip Break
          </Button>
          <Button
            type="button"
            onClick={handleStartBreak}
            disabled={createSessionMutation.isPending}
            className="sm:w-full"
          >
            Start Break
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
