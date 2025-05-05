import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7');
  
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['/api/sessions/stats', timeRange],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/sessions/stats?days=${queryKey[1]}`);
      if (!response.ok) throw new Error('Failed to fetch stats data');
      return response.json();
    }
  });
  
  // Format date strings for chart display
  const formatChartData = (data) => {
    if (!data) return [];
    
    return data.map(day => ({
      ...day,
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  };
  
  const chartData = statsData ? formatChartData(statsData.dailyData) : [];
  
  // Colors for pie chart
  const COLORS = ['#3A55D5', '#F44336'];
  
  // Calculate completion rate data for pie chart
  const getPieData = () => {
    if (!statsData) return [];
    
    const { completedWorkSessions, abortedWorkSessions } = statsData.summary;
    return [
      { name: 'Completed', value: completedWorkSessions },
      { name: 'Aborted', value: abortedWorkSessions }
    ];
  };

  return (
    <div className="h-screen flex overflow-hidden bg-neutral-100">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center justify-between border-b border-neutral-200 bg-white h-16 px-4">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13H13v6l4.75 2.85-0.75 1.24-5.5-3.34V7z" />
            </svg>
            <span className="ml-2 text-lg font-semibold text-primary">FocusFlow</span>
          </div>
        </div>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl font-semibold text-neutral-900 mb-4 md:mb-0">Focus Analytics</h1>
                
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-neutral-500">Time Range:</span>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="14">Last 14 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Summary metrics */}
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-light rounded-md p-3">
                        <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-neutral-500 truncate">
                          Total Focus Time
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-neutral-900">
                            {isLoading ? '...' : 
                              `${statsData?.summary?.totalFocusTimeMinutes || 0} min`}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-light rounded-md p-3">
                        <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-neutral-500 truncate">
                          Completed Sessions
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-neutral-900">
                            {isLoading ? '...' : 
                              statsData?.summary?.completedWorkSessions || 0}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-light rounded-md p-3">
                        <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-neutral-500 truncate">
                          Aborted Sessions
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-neutral-900">
                            {isLoading ? '...' : 
                              statsData?.summary?.abortedWorkSessions || 0}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-light rounded-md p-3">
                        <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-neutral-500 truncate">
                          Completion Rate
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-neutral-900">
                            {isLoading ? '...' : 
                              `${statsData?.summary?.completionRate || 0}%`}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts */}
              <div className="mt-8">
                <Tabs defaultValue="time">
                  <TabsList>
                    <TabsTrigger value="time">Focus Time</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                    <TabsTrigger value="completion">Completion Rate</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="time">
                    <Card>
                      <CardHeader>
                        <CardTitle>Focus Time by Day</CardTitle>
                        <CardDescription>
                          Minutes spent focusing each day
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[400px]">
                          {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                              <p>Loading chart data...</p>
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
                                <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="focusMinutes" name="Focus Time (minutes)" fill="#3A55D5" />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="sessions">
                    <Card>
                      <CardHeader>
                        <CardTitle>Sessions by Day</CardTitle>
                        <CardDescription>
                          Number of completed and aborted sessions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[400px]">
                          {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                              <p>Loading chart data...</p>
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
                                <YAxis label={{ value: 'Sessions', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="completedSessions" name="Completed" fill="#4CAF50" />
                                <Bar dataKey="abortedSessions" name="Aborted" fill="#F44336" />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="completion">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Completion Rate Trend</CardTitle>
                          <CardDescription>
                            Success rate over time
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[400px]">
                            {isLoading ? (
                              <div className="flex items-center justify-center h-full">
                                <p>Loading chart data...</p>
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={chartData.map(day => ({
                                    ...day,
                                    completionRate: day.completedSessions + day.abortedSessions > 0 
                                      ? Math.round((day.completedSessions / (day.completedSessions + day.abortedSessions)) * 100) 
                                      : 0
                                  }))}
                                  margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                  }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis domain={[0, 100]} label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }} />
                                  <Tooltip />
                                  <Legend />
                                  <Line type="monotone" dataKey="completionRate" name="Completion Rate (%)" stroke="#7E57C2" activeDot={{ r: 8 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Overall Completion Rate</CardTitle>
                          <CardDescription>
                            Completed vs aborted sessions
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[400px]">
                            {isLoading ? (
                              <div className="flex items-center justify-center h-full">
                                <p>Loading chart data...</p>
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={getPieData()}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={150}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {getPieData().map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
