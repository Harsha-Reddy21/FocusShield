import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AbortSessionModalProps {
  isOpen: boolean;
  onConfirm: (reason: string | null) => void;
  onCancel: () => void;
  currentSession: Session | null;
}

export default function AbortSessionModal({
  isOpen,
  onConfirm,
  onCancel,
  currentSession,
}: AbortSessionModalProps) {
  const [reason, setReason] = useState<string | null>(null);
  
  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async () => {
      if (!currentSession) return null;
      
      const res = await apiRequest('PUT', `/api/sessions/${currentSession.id}`, {
        endTime: new Date().toISOString(),
        aborted: true,
        abortReason: reason,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/stats'] });
      onConfirm(reason);
    },
  });
  
  const handleConfirm = () => {
    updateSessionMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abort Focus Session?</DialogTitle>
          <DialogDescription>
            You're about to end your focus session early. This will be recorded in your analytics.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <label htmlFor="abortReason" className="block text-sm font-medium text-neutral-700">
            Reason for ending early (optional)
          </label>
          <Select value={reason || ''} onValueChange={setReason}>
            <SelectTrigger id="abortReason" className="mt-1">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select a reason</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="meeting">Unexpected meeting</SelectItem>
              <SelectItem value="distracted">Too distracted</SelectItem>
              <SelectItem value="tired">Feeling tired</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter className="sm:justify-between mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Continue Session
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={updateSessionMutation.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Abort Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
