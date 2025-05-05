import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { BlockedSite } from '@shared/schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

interface BlocklistSectionProps {
  blockedSites?: BlockedSite[];
  isBlocking: boolean;
}

export default function BlocklistSection({ blockedSites = [], isBlocking }: BlocklistSectionProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Form for adding a new website
  const form = useForm<z.infer<typeof addWebsiteSchema>>({
    resolver: zodResolver(addWebsiteSchema),
    defaultValues: {
      domain: '',
    },
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
    <div className="mt-8 bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-900">Distraction Blocklist</h2>
        <Badge variant={isBlocking ? "success" : "secondary"}>
          {isBlocking ? "Active" : "Inactive"}
        </Badge>
      </div>
      
      <p className="mt-1 text-sm text-neutral-500">
        These websites and apps will be blocked during your focus sessions.
      </p>
      
      <div className="mt-6">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <Table>
            <TableHeader className="bg-neutral-50">
              <TableRow>
                <TableHead className="w-full">Website / App</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blockedSites.length > 0 ? (
                blockedSites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">{site.domain}</TableCell>
                    <TableCell>
                      {isBlocking ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge variant="outline">Ready to block</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSiteMutation.mutate(site.id)}
                        disabled={removeSiteMutation.isPending}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-neutral-500">
                    No websites in blocklist. Add websites below to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Add New Site Form */}
        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input 
                        placeholder="Add website to block (e.g., facebook.com)" 
                        {...field} 
                        disabled={addSiteMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={addSiteMutation.isPending}
              >
                Add to blocklist
              </Button>
            </form>
          </Form>
        </div>
      </div>
      
      <div className="mt-4 text-right">
        <Button 
          variant="link" 
          onClick={() => navigate('/blocklist')}
          className="text-primary"
        >
          Manage full blocklist
        </Button>
      </div>
    </div>
  );
}
