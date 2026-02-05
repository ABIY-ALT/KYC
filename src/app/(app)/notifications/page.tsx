"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  FilePlus2,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Clock,
  Circle,
  CircleDot,
} from 'lucide-react';
import { notifications as initialNotifications, type Notification } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const notificationIcons: { [key in Notification['type']]: React.ElementType } = {
  'New Submission': FilePlus2,
  'Amendment Request': AlertTriangle,
  'Approval': CheckCircle,
  'Escalation': ShieldAlert,
  'SLA Warning': Clock,
};

function NotificationItem({ notification, onMarkAsRead, isClient }: { notification: Notification, onMarkAsRead: (id: string) => void, isClient: boolean }) {
  const router = useRouter();
  const Icon = notificationIcons[notification.type] || Bell;

  const handleItemClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    router.push(notification.linkTo);
  }

  const iconColor = {
      'New Submission': 'text-primary',
      'Amendment Request': 'text-accent',
      'Approval': 'text-muted-foreground', // Using a neutral color for approved items
      'Escalation': 'text-destructive',
      'SLA Warning': 'text-accent',
  }[notification.type];

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer hover-lift"
      onClick={handleItemClick}
    >
      <div className={cn("mt-1", iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className={cn("font-medium text-sm", { "font-semibold": !notification.isRead })}>{notification.message}</p>
        <p className="text-xs text-muted-foreground">
          {isClient ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true }) : <Skeleton className="h-3 w-20 mt-1" />}
        </p>
      </div>
       <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          if (!notification.isRead) onMarkAsRead(notification.id); 
        }} 
        className="p-1"
        title={notification.isRead ? "Read" : "Mark as read"}
      >
        {notification.isRead ? <Circle className="h-3 w-3 text-muted-foreground/50" /> : <CircleDot className="h-3 w-3 text-primary" />}
        <span className="sr-only">{notification.isRead ? "Read" : "Mark as read"}</span>
      </button>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMarkAsRead = (id: string) => {
    setNotifications(currentNotifications =>
      currentNotifications.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(currentNotifications =>
      currentNotifications.map(n => ({ ...n, isRead: true }))
    );
    toast({
        title: "All Read",
        description: "All notifications have been marked as read.",
    })
  };
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications
    .filter(n => filter === 'all' || (filter === 'unread' && !n.isRead))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <Card className="h-full flex flex-col hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="grid gap-1">
                <CardTitle className="flex items-center gap-2 gradient-text">
                <Bell />
                Notifications
                </CardTitle>
                <CardDescription>
                You have {unreadCount} unread message{unreadCount !== 1 && 's'}.
                </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                Mark all as read
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="mt-4 flex-grow overflow-y-auto">
            {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => (
                    <div key={notification.id}>
                        <NotificationItem notification={notification} onMarkAsRead={handleMarkAsRead} isClient={isClient} />
                        {index < filteredNotifications.length - 1 && <Separator />}
                    </div>
                ))
            ) : (
                <div className="text-center text-muted-foreground pt-16">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4">
                        {filter === 'unread' ? "You're all caught up!" : "No notifications here."}
                    </p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
