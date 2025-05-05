import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import TimerCard from "@/components/timer/timer-card";
import SessionInfoCard from "@/components/timer/session-info-card";
import BlocklistSection from "@/components/blocklist/blocklist-section";
import AnalyticsPreview from "@/components/analytics/analytics-preview";
import AbortSessionModal from "@/components/modals/abort-session-modal";
import SessionCompleteModal from "@/components/modals/session-complete-modal";
import { Session } from "@shared/schema";

export default function HomePage() {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isAbortModalOpen, setIsAbortModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  
  // Fetch today's session data
  const { data: todayData } = useQuery({
    queryKey: ["/api/sessions/today"],
    refetchInterval: currentSession ? 0 : 30000, // Only refetch if no active session
  });

  // Fetch timer settings
  const { data: timerSettings } = useQuery({
    queryKey: ["/api/timer-settings"],
  });

  // Fetch blocked sites
  const { data: blockedSites } = useQuery({
    queryKey: ["/api/blocklist"],
  });
  
  // Session event handlers
  const handleSessionStart = (session: Session) => {
    setCurrentSession(session);
  };
  
  const handleSessionComplete = (session: Session) => {
    setCurrentSession(null);
    setIsCompleteModalOpen(true);
  };
  
  const handleAbortRequest = () => {
    setIsAbortModalOpen(true);
  };
  
  const handleAbortConfirm = (reason: string | null) => {
    setIsAbortModalOpen(false);
    setCurrentSession(null);
  };
  
  const handleAbortCancel = () => {
    setIsAbortModalOpen(false);
  };
  
  const handleAfterBreak = () => {
    setIsCompleteModalOpen(false);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-neutral-100">
      {/* Sidebar (desktop) */}
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center justify-between border-b border-neutral-200 bg-white h-16 px-4">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13H13v6l4.75 2.85-0.75 1.24-5.5-3.34V7z" />
            </svg>
            <span className="ml-2 text-lg font-semibold text-primary">FocusFlow</span>
          </div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-2xl font-semibold text-neutral-900">Focus Timer</h1>
              
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Timer card */}
                <TimerCard 
                  className="col-span-2"
                  currentSession={currentSession}
                  timerSettings={timerSettings}
                  onSessionStart={handleSessionStart}
                  onSessionComplete={handleSessionComplete}
                  onAbortRequest={handleAbortRequest}
                />
                
                {/* Session info card */}
                <SessionInfoCard 
                  currentSession={currentSession}
                  todayData={todayData}
                  blockedSites={blockedSites}
                />
              </div>
              
              {/* Blocklist section */}
              <BlocklistSection 
                blockedSites={blockedSites}
                isBlocking={!!currentSession && currentSession.type === 'work'}
              />
              
              {/* Analytics preview */}
              <AnalyticsPreview />
            </div>
          </div>
        </main>
        
        {/* Mobile navigation */}
        <MobileNav />
      </div>
      
      {/* Modals */}
      <AbortSessionModal 
        isOpen={isAbortModalOpen}
        onConfirm={handleAbortConfirm}
        onCancel={handleAbortCancel}
        currentSession={currentSession}
      />
      
      <SessionCompleteModal 
        isOpen={isCompleteModalOpen}
        onStartBreak={handleAfterBreak}
        onSkipBreak={handleAfterBreak}
        session={currentSession}
      />
    </div>
  );
}
