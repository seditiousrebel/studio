'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { placeholderNotifications } from '@/lib/placeholder-data';
import type { Notification } from '@/lib/types';
import { Bell, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast"


export default function NotificationsPage() {
  // In a real app, fetch notifications for the current user
  // For now, using placeholder data.
  // We'd also need state management for marking as read/deleting.
  const { toast } = useToast();

  const handleMarkAsRead = (id: string) => {
    // Placeholder: Log action and show toast
    console.log(`Marking notification ${id} as read.`);
    toast({ title: "Notification Marked", description: "Notification marked as read." });
    // Here you would update the notification state
  };

  const handleDeleteNotification = (id: string) => {
    // Placeholder: Log action and show toast
    console.log(`Deleting notification ${id}.`);
    toast({ title: "Notification Deleted", description: "Notification has been removed.", variant: "destructive" });
     // Here you would update the notification state
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Notifications</h1>
        <Bell className="h-6 w-6 text-muted-foreground" />
      </div>
      
      {placeholderNotifications.length > 0 ? (
        <Card>
          <CardContent className="pt-0">
            <ul className="divide-y divide-border">
              {placeholderNotifications.map((notification: Notification) => (
                <li 
                  key={notification.id} 
                  className={cn(
                    "py-4 px-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2",
                    notification.isRead ? "opacity-70" : "bg-card"
                  )}
                >
                  <div className="flex-grow">
                    <p className={cn("text-sm font-medium", !notification.isRead && "text-foreground")}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                    {notification.link && (
                      <Link href={notification.link} passHref>
                        <Button variant="link" size="sm" className="p-0 h-auto text-xs text-accent hover:text-accent/80">
                          View Details
                        </Button>
                      </Link>
                    )}
                  </div>
                  <div className="flex gap-2 self-start sm:self-center mt-2 sm:mt-0 shrink-0">
                    {!notification.isRead && (
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleMarkAsRead(notification.id)} aria-label="Mark as read">
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteNotification(notification.id)} aria-label="Delete notification">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">You have no new notifications.</p>
          </CardContent>
        </Card>
      )}
       <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={() => toast({ title: "Marked All As Read", description: "All notifications marked as read."})}>Mark All as Read</Button>
      </div>
    </div>
  );
}
