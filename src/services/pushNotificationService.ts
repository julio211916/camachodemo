import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  async init(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) return 'denied';
    
    const permission = await Notification.requestPermission();
    return permission;
  }

  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isSupported) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Show via service worker if available
    if (this.swRegistration) {
      await this.swRegistration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        tag: payload.tag,
        data: { url: payload.url },
        requireInteraction: true
      });
    } else {
      // Fallback to regular notification
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        tag: payload.tag
      });
    }
  }

  // Subscribe to realtime appointment changes
  subscribeToAppointments(locationId?: string | null) {
    const channel = supabase
      .channel('push-appointments-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          ...(locationId ? { filter: `location_id=eq.${locationId}` } : {})
        },
        async (payload) => {
          const appointment = payload.new as {
            patient_name: string;
            appointment_date: string;
            appointment_time: string;
            location_name: string;
            service_name: string;
          };

          // Show push notification
          await this.showLocalNotification({
            title: '🦷 Nueva Cita Agendada',
            body: `${appointment.patient_name} - ${appointment.service_name}\n${appointment.appointment_date} a las ${appointment.appointment_time}`,
            tag: `appointment-${Date.now()}`,
            url: '/portal'
          });

          // Also show toast
          toast.success('Nueva cita agendada', {
            description: `${appointment.patient_name} - ${appointment.service_name}`,
            duration: 5000
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          ...(locationId ? { filter: `location_id=eq.${locationId}` } : {})
        },
        async (payload) => {
          const appointment = payload.new as {
            patient_name: string;
            status: string;
            service_name: string;
          };
          const oldAppointment = payload.old as { status: string };

          // Only notify on status changes
          if (oldAppointment?.status !== appointment.status) {
            const statusMessages: Record<string, { title: string; emoji: string }> = {
              confirmed: { title: 'Cita Confirmada', emoji: '✅' },
              cancelled: { title: 'Cita Cancelada', emoji: '❌' },
              completed: { title: 'Cita Completada', emoji: '🎉' }
            };

            const statusInfo = statusMessages[appointment.status];
            if (statusInfo) {
              await this.showLocalNotification({
                title: `${statusInfo.emoji} ${statusInfo.title}`,
                body: `${appointment.patient_name} - ${appointment.service_name}`,
                tag: `appointment-update-${Date.now()}`,
                url: '/portal'
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Subscribe to review notifications
  subscribeToReviews() {
    const channel = supabase
      .channel('push-reviews-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews'
        },
        async (payload) => {
          const review = payload.new as {
            patient_name: string;
            rating: number;
            comment?: string;
          };

          await this.showLocalNotification({
            title: '⭐ Nueva Reseña Recibida',
            body: `${review.patient_name} - ${'⭐'.repeat(review.rating)}\n${review.comment || ''}`,
            tag: `review-${Date.now()}`,
            url: '/portal'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Subscribe to transaction notifications (high value)
  subscribeToTransactions(minAmount = 5000) {
    const channel = supabase
      .channel('push-transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions'
        },
        async (payload) => {
          const transaction = payload.new as {
            amount: number;
            transaction_type: string;
            patient_name?: string;
            description: string;
          };

          if (transaction.transaction_type === 'income' && transaction.amount >= minAmount) {
            const formattedAmount = new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN'
            }).format(transaction.amount);

            await this.showLocalNotification({
              title: '💰 Pago Recibido',
              body: `${formattedAmount} - ${transaction.patient_name || transaction.description}`,
              tag: `transaction-${Date.now()}`,
              url: '/portal'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
