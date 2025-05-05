import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';

// Schema for timer settings
const timerSettingsSchema = z.object({
  workDuration: z.coerce
    .number()
    .min(1, 'Minimum work duration is 1 minute')
    .max(60, 'Maximum work duration is 60 minutes'),
  breakDuration: z.coerce
    .number()
    .min(1, 'Minimum break duration is 1 minute')
    .max(30, 'Maximum break duration is 30 minutes'),
  longBreakDuration: z.coerce
    .number()
    .min(5, 'Minimum long break duration is 5 minutes')
    .max(60, 'Maximum long break duration is 60 minutes'),
  sessionsBeforeLongBreak: z.coerce
    .number()
    .min(1, 'Minimum number of sessions is 1')
    .max(10, 'Maximum number of sessions is 10'),
  soundEnabled: z.boolean(),
  notificationsEnabled: z.boolean(),
});

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  
  // Fetch timer settings
  const { data: timerSettings, isLoading } = useQuery({
    queryKey: ['/api/timer-settings'],
  });
  
  // Timer settings form
  const form = useForm<z.infer<typeof timerSettingsSchema>>({
    resolver: zodResolver(timerSettingsSchema),
    defaultValues: {
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
      soundEnabled: true,
      notificationsEnabled: true,
    },
  });
  
  // Update form when settings are loaded
  useState(() => {
    if (timerSettings) {
      form.reset({
        workDuration: timerSettings.workDuration,
        breakDuration: timerSettings.breakDuration,
        longBreakDuration: timerSettings.longBreakDuration,
        sessionsBeforeLongBreak: timerSettings.sessionsBeforeLongBreak,
        soundEnabled: timerSettings.soundEnabled,
        notificationsEnabled: timerSettings.notificationsEnabled,
      });
    }
  });
  
  // Update timer settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof timerSettingsSchema>) => {
      const res = await apiRequest('PUT', '/api/timer-settings', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timer-settings'] });
      toast({
        title: 'Settings updated',
        description: 'Your timer settings have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: z.infer<typeof timerSettingsSchema>) => {
    updateSettingsMutation.mutate(data);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
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
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
              
              {/* User profile */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>
                    Your account information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="rounded-full bg-primary/10 p-2 mr-4">
                      <svg className="h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{user?.name}</h3>
                      <p className="text-neutral-500">{user?.email}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      "Sign out"
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Timer settings */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Timer Settings</CardTitle>
                  <CardDescription>
                    Customize your Pomodoro timer intervals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="workDuration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Work Duration (minutes)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    min={1}
                                    max={60}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Duration of each focus session
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="breakDuration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Break Duration (minutes)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    min={1}
                                    max={30}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Duration of short breaks
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="longBreakDuration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Long Break Duration (minutes)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    min={5}
                                    max={60}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Duration of long breaks after multiple sessions
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="sessionsBeforeLongBreak"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sessions Before Long Break</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    min={1}
                                    max={10}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Number of work sessions before a long break
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Notifications</h3>
                          
                          <FormField
                            control={form.control}
                            name="soundEnabled"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Sound Alerts</FormLabel>
                                  <FormDescription>
                                    Play sounds when sessions start and end
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="notificationsEnabled"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Desktop Notifications</FormLabel>
                                  <FormDescription>
                                    Show desktop notifications when sessions start and end
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          disabled={updateSettingsMutation.isPending || !form.formState.isDirty}
                        >
                          {updateSettingsMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Settings
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
