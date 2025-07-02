import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Trash2, Settings, Filter, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobilePageWrapper } from "@/components/layout/mobile-page-wrapper";
import { motion, AnimatePresence } from "framer-motion";
import type { Notification } from "@shared/schema";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<"all" | "unread" | "read">("all");

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => 
      fetch(`/api/notifications/${id}/read`, { method: 'POST' })
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => 
      fetch('/api/notifications/mark-all-read', { method: 'POST' })
        .then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => 
      fetch(`/api/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const filteredNotifications = notifications.filter(notification => {
    if (filterType === "unread") return !notification.isRead;
    if (filterType === "read") return notification.isRead;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return { icon: '✓', color: 'text-green-600 bg-green-100' };
      case 'warning':
        return { icon: '⚠', color: 'text-yellow-600 bg-yellow-100' };
      case 'error':
        return { icon: '✕', color: 'text-red-600 bg-red-100' };
      default:
        return { icon: 'ℹ', color: 'text-blue-600 bg-blue-100' };
    }
  };

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: number) => {
    deleteNotificationMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  if (isLoading) {
    return (
      <MobilePageWrapper title="Notifications">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </MobilePageWrapper>
    );
  }

  return (
    <MobilePageWrapper title="Notifications">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h1>
            </div>
            {unreadCount.count > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {unreadCount.count} unread
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {unreadCount.count > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={markAllAsReadMutation.isPending}
              >
                <Check className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
            
            {/* Filter Dropdown */}
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No notifications
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  {filterType === "all" 
                    ? "You're all caught up! No notifications to show."
                    : `No ${filterType} notifications found.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => {
                const { icon, color } = getNotificationIcon(notification.type);
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card 
                      className={`
                        bg-white dark:bg-gray-800 
                        border-2 transition-all duration-300
                        hover:shadow-lg hover:-translate-y-1
                        ${!notification.isRead 
                          ? "border-purple-200 bg-purple-50 dark:bg-purple-900/10 shadow-md shadow-purple-500/10" 
                          : "border-gray-200 dark:border-gray-700"
                        }
                      `}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Notification Icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} flex-shrink-0`}>
                            <span className="text-sm font-semibold">{icon}</span>
                          </div>

                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {notification.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {!notification.isRead && (
                                  <Button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                                    disabled={markAsReadMutation.isPending}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button
                                  onClick={() => handleDelete(notification.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  disabled={deleteNotificationMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </MobilePageWrapper>
  );
}