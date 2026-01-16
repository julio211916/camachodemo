import React, { useState, useEffect, useCallback } from 'react';
import { Dropdown, Badge, Button, List, Typography, Empty, Spin, Tag } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, CalendarOutlined, StarOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const { Text, Title } = Typography;

interface Notification {
  id: string;
  type: 'appointment' | 'review' | 'system';
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  data?: Record<string, unknown>;
}

export function NotificationsDropdown() {
  const { user, userRole } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const notifs: Notification[] = [];

    try {
      // Fetch recent appointments based on role
      if (userRole === 'admin' || userRole === 'staff') {
        // Admin/Staff see all pending appointments
        const { data: appointments } = await supabase
          .from('appointments')
          .select('id, patient_name, appointment_date, appointment_time, service_name, status, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10);

        appointments?.forEach(apt => {
          notifs.push({
            id: `apt-${apt.id}`,
            type: 'appointment',
            title: 'Cita pendiente',
            description: `${apt.patient_name} - ${apt.service_name}`,
            createdAt: apt.created_at,
            read: false,
            data: apt,
          });
        });

        // Fetch recent reviews
        const { data: reviews } = await supabase
          .from('reviews')
          .select('id, patient_name, rating, comment, created_at, is_published')
          .eq('is_published', false)
          .order('created_at', { ascending: false })
          .limit(5);

        reviews?.forEach(review => {
          notifs.push({
            id: `rev-${review.id}`,
            type: 'review',
            title: 'Nueva reseña por aprobar',
            description: `${review.patient_name} - ${review.rating} estrellas`,
            createdAt: review.created_at,
            read: false,
            data: review,
          });
        });
      } else if (userRole === 'doctor') {
        // Doctors see their assigned appointments
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (doctorData) {
          const { data: appointments } = await supabase
            .from('appointments')
            .select('id, patient_name, appointment_date, appointment_time, service_name, status, created_at')
            .eq('doctor_id', doctorData.id)
            .eq('status', 'confirmed')
            .order('appointment_date', { ascending: true })
            .limit(10);

          appointments?.forEach(apt => {
            notifs.push({
              id: `apt-${apt.id}`,
              type: 'appointment',
              title: 'Cita confirmada',
              description: `${apt.patient_name} - ${apt.service_name}`,
              createdAt: apt.created_at,
              read: false,
              data: apt,
            });
          });
        }
      } else if (userRole === 'patient') {
        // Patients see their upcoming appointments
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', user.id)
          .single();

        if (profile?.email) {
          const { data: appointments } = await supabase
            .from('appointments')
            .select('id, patient_name, appointment_date, appointment_time, service_name, status, created_at')
            .eq('patient_email', profile.email)
            .in('status', ['pending', 'confirmed'])
            .order('appointment_date', { ascending: true })
            .limit(10);

          appointments?.forEach(apt => {
            notifs.push({
              id: `apt-${apt.id}`,
              type: 'appointment',
              title: apt.status === 'confirmed' ? 'Cita confirmada' : 'Cita pendiente',
              description: `${apt.service_name} - ${format(parseISO(apt.appointment_date), 'd MMM', { locale: es })}`,
              createdAt: apt.created_at,
              read: false,
              data: apt,
            });
          });
        }
      }

      // Sort by date
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const appointmentChannel = supabase
      .channel('notifications-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    const reviewChannel = supabase
      .channel('notifications-reviews')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reviews' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentChannel);
      supabase.removeChannel(reviewChannel);
    };
  }, [user, fetchNotifications]);

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    return format(date, 'd MMM', { locale: es });
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.length;

  const dropdownContent = (
    <div className="w-80 max-h-96 overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <Title level={5} className="!mb-0">Notificaciones</Title>
        {notifications.length > 0 && (
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={handleClearAll}
            className="text-gray-500 hover:text-red-500"
          >
            Limpiar
          </Button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            description="Sin notificaciones"
            className="py-8"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                onClick={() => handleMarkAsRead(item.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.type === 'appointment' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'review' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {item.type === 'appointment' ? <CalendarOutlined /> : <StarOutlined />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Text strong className="text-sm truncate">{item.title}</Text>
                      <Text type="secondary" className="text-xs whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </Text>
                    </div>
                    <Text type="secondary" className="text-xs block truncate">
                      {item.description}
                    </Text>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(item.id);
                    }}
                    className="text-green-500 hover:text-green-600"
                  />
                </div>
              </List.Item>
            )}
          />
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
          <Button type="link" size="small">
            Ver todas
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined />}
          className="text-gray-600 hover:text-primary"
        />
      </Badge>
    </Dropdown>
  );
}
