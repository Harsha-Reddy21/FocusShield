import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Clock, CheckCircle, AlertTriangle, BarChart2 } from 'lucide-react';

export default function AnalyticsPreview() {
  const [, navigate] = useLocation();
  
  // Fetch session stats
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['/api/sessions/stats'],
  });
  
  // Format date strings for chart display
  const formatChartData = (data: any[]) => {
    if (!data) return [];
    
    return data.map(day => ({
      ...day,
      date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
    }));
  };
  
  const chartData = statsData ? formatChartData(statsData.dailyData) : [];

  return (
    <div className="mt-8 bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-900">Focus Analytics</h2>
        <Button 
          variant="link" 
          onClick={() => navigate('/analytics')}
          className="text-primary"
        >
          View full analytics
        </Button>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-light rounded-md p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-neutral-500 truncate">
                  Today's Focus Time
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-neutral-900">
                    {isLoading ? '0:00' : 
                      `${statsData?.summary?.totalFocusTimeMinutes || 0} min`}
                  </div>
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-light rounded-md p-3">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-neutral-500 truncate">
                  Completed Sessions
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-neutral-900">
                    {isLoading ? '0' : 
                      statsData?.summary?.completedWorkSessions || 0}
                  </div>
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-light rounded-md p-3">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-neutral-500 truncate">
                  Aborted Sessions
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-neutral-900">
                    {isLoading ? '0' : 
                      statsData?.summary?.abortedWorkSessions || 0}
                  </div>
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-light rounded-md p-3">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-neutral-500 truncate">
                  Completion Rate
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-neutral-900">
                    {isLoading ? '0%' : 
                      `${statsData?.summary?.completionRate || 0}%`}
                  </div>
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-neutral-900">Weekly Focus Summary</h3>
            <div className="mt-4" style={{ height: 300 }}>
              {isLoading || !chartData.length ? (
                <div className="flex items-center justify-center h-full text-neutral-500">
                  No data available yet. Complete focus sessions to see your progress.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="focusMinutes" name="Focus Time (minutes)" fill="#3A55D5" />
                    <Bar dataKey="completedSessions" name="Completed Sessions" fill="#7E57C2" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
