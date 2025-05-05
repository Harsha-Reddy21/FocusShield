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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Schema for adding a new website
const addWebsiteSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .regex(
      /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      'Please enter a valid domain (e.g., facebook.com)'
    ),
});

export default function BlocklistPage() {
  const { toast } = useToast();
  const [isBlocking, setIsBlocking] = useState(false);
  
  // Form for adding a new website
  const form = useForm<z.infer<typeof addWebsiteSchema>>({
    resolver: zodResolver(addWebsiteSchema),
    defaultValues: {
      domain: '',
    },
  });
  
  // Fetch blocklist
  const { data: blockedSites, isLoading, error } = useQuery({
    queryKey: ['/api/blocklist'],
  });
  
  // Add site to blocklist
  const addSiteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addWebsiteSchema>) => {
      const res = await apiRequest('POST', '/api/blocklist', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blocklist'] });
      form.reset();
      toast({
        title: 'Website added',
        description: 'The website has been added to your blocklist.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add website',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Remove site from blocklist
  const removeSiteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/blocklist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blocklist'] });
      toast({
        title: 'Website removed',
        description: 'The website has been removed from your blocklist.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove website',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: z.infer<typeof addWebsiteSchema>) => {
    addSiteMutation.mutate(data);
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
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-neutral-900">Distraction Blocklist</h1>
                <Badge variant={isBlocking ? "success" : "secondary"}>
                  {isBlocking ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <p className="mt-2 text-neutral-500">
                Add websites that distract you. During focus sessions, these sites will be blocked.
              </p>
              
              {/* Add website form */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Add Website to Blocklist</CardTitle>
                  <CardDescription>
                    Enter domain names you want to block during focus sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
                      <FormField
                        control={form.control}
                        name="domain"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Website Domain</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., facebook.com" 
                                {...field} 
                                disabled={addSiteMutation.isPending}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter only the domain name without http:// or www.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        disabled={addSiteMutation.isPending}
                        className="mb-[2px]"
                      >
                        {addSiteMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Add to Blocklist
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              {/* Blocklist table */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Your Blocklist</CardTitle>
                  <CardDescription>
                    Manage websites that will be blocked during focus sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        Failed to load your blocklist. Please try again.
                      </AlertDescription>
                    </Alert>
                  ) : isLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : blockedSites && blockedSites.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Website Domain</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blockedSites.map((site) => (
                          <TableRow key={site.id}>
                            <TableCell className="font-medium">{site.domain}</TableCell>
                            <TableCell>
                              <Badge variant={isBlocking ? "destructive" : "outline"}>
                                {isBlocking ? "Blocked" : "Ready to block"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSiteMutation.mutate(site.id)}
                                disabled={removeSiteMutation.isPending}
                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                              >
                                {removeSiteMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Remove
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-8 text-neutral-500">
                      <p>Your blocklist is empty. Add websites above to get started.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* How it works */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>How Website Blocking Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md bg-neutral-100 p-4">
                    <ul className="list-disc list-inside space-y-2 text-neutral-700">
                      <li>Websites are blocked <strong>only during active focus sessions</strong></li>
                      <li>Blocking is automatically disabled during breaks</li>
                      <li>You can add both specific domains (facebook.com) and subdomains (app.example.com)</li>
                      <li>Blocking prevents you from accessing these sites by redirecting you back to the timer</li>
                    </ul>
                  </div>
                  
                  <div className="text-sm text-neutral-500">
                    <p>
                      Note: The blocking feature is designed to help you avoid distractions, but it's not meant to be a strict security measure. 
                      If you absolutely need to access a blocked site, you can pause or end your focus session.
                    </p>
                  </div>
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
