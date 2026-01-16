import { useEffect, useRef, useCallback } from 'react';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/hooks/useAuth';
import pushNotificationService from '@/services/pushNotificationService';

export function usePushNotificationSubscription() {
  const { currentBranch, viewMode } = useBranch();
  const { user, userRole } = useAuth();
  const unsubscribersRef = useRef<(() => void)[]>([]);

  const cleanup = useCallback(() => {
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];
  }, []);

  useEffect(() => {
    // Only subscribe for admin/staff/doctor roles
    if (!user || !['admin', 'staff', 'doctor'].includes(userRole || '')) {
      return;
    }

    const initAndSubscribe = async () => {
      // Initialize service worker
      const initialized = await pushNotificationService.init();
      if (!initialized) return;

      // Request permission
      const permission = await pushNotificationService.requestPermission();
      if (permission !== 'granted') return;

      // Cleanup previous subscriptions
      cleanup();

      // Determine location filter
      const locationId = viewMode === 'local' ? currentBranch?.id : null;

      // Subscribe to appointments
      const unsubAppointments = pushNotificationService.subscribeToAppointments(locationId);
      unsubscribersRef.current.push(unsubAppointments);

      // Subscribe to reviews (only for admin/staff)
      if (['admin', 'staff'].includes(userRole || '')) {
        const unsubReviews = pushNotificationService.subscribeToReviews();
        unsubscribersRef.current.push(unsubReviews);

        // Subscribe to high-value transactions
        const unsubTransactions = pushNotificationService.subscribeToTransactions(5000);
        unsubscribersRef.current.push(unsubTransactions);
      }
    };

    initAndSubscribe();

    return cleanup;
  }, [user, userRole, currentBranch?.id, viewMode, cleanup]);

  return {
    requestPermission: () => pushNotificationService.requestPermission(),
    showNotification: (title: string, body: string) => 
      pushNotificationService.showLocalNotification({ title, body })
  };
}

export default usePushNotificationSubscription;
