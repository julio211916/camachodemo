import React from 'react';
import { Layout, Input, Avatar, Dropdown, Button, Tag, Typography, Badge } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  GlobalOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/hooks/useAuth';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { useThemePreference } from '@/hooks/useThemePreference';
import type { MenuProps } from 'antd';

const { Header } = Layout;
const { Text } = Typography;

interface UnifiedHeaderProps {
  collapsed: boolean;
}

export function UnifiedHeader({ collapsed }: UnifiedHeaderProps) {
  const { currentBranch, viewMode, branchSummaries } = useBranch();
  const { profile, userRole, signOut } = useAuth();
  const { updateThemePreference } = useThemePreference();

  // Get current branch summary
  const currentSummary = branchSummaries.find(s => s.location_id === currentBranch?.id);
  
  // Global summary (sum of all branches)
  const globalSummary = branchSummaries.reduce((acc, s) => ({
    total_appointments_today: acc.total_appointments_today + s.total_appointments_today,
    pending_appointments: acc.pending_appointments + s.pending_appointments,
    income_today: acc.income_today + s.income_today,
    expenses_today: acc.expenses_today + s.expenses_today,
  }), { total_appointments_today: 0, pending_appointments: 0, income_today: 0, expenses_today: 0 });

  const summary = viewMode === 'global' ? globalSummary : currentSummary;

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Mi Perfil',
      icon: <UserOutlined />,
    },
    {
      key: 'settings',
      label: 'Configuración',
      icon: <SettingOutlined />,
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: 'Cerrar Sesión',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: signOut,
    },
  ];

  return (
    <Header className="bg-white border-b border-gray-200 px-6 flex items-center justify-between h-16">
      {/* Left Section - Branch Info & Stats */}
      <div className="flex items-center gap-6">
        {/* View Mode Indicator */}
        <div className="flex items-center gap-2">
          {viewMode === 'global' ? (
            <Tag icon={<GlobalOutlined />} color="processing">
              Vista Global
            </Tag>
          ) : (
            <Tag icon={<HomeOutlined />} color="success">
              {currentBranch?.name || 'Sucursal'}
            </Tag>
          )}
        </div>

        {/* Quick Stats */}
        {summary && (
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Citas hoy:</span>
              <Badge count={summary.total_appointments_today} showZero color="blue" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Pendientes:</span>
              <Badge count={summary.pending_appointments} showZero color="orange" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Ingresos:</span>
              <Text strong className="text-green-600">
                ${(summary.income_today || 0).toLocaleString()}
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-8">
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Buscar paciente, cita, factura..."
          className="rounded-full"
          size="middle"
        />
      </div>

      {/* Right Section - Actions & User */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <AnimatedThemeToggler
          onThemeChange={updateThemePreference}
          className="text-gray-600"
        />

        {/* Notifications Dropdown */}
        <NotificationsDropdown />

        {/* User Menu */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
            <Avatar
              size={36}
              src={profile?.avatar_url}
              icon={<UserOutlined />}
              className="bg-teal-500"
            />
            <div className="hidden md:block text-right">
              <Text strong className="block text-sm leading-tight">
                {profile?.full_name || 'Usuario'}
              </Text>
              <Text type="secondary" className="text-xs">
                {userRole === 'admin' ? 'Admin Master' : 
                 userRole === 'staff' ? 'Staff' :
                 userRole === 'doctor' ? 'Doctor' : 'Paciente'}
              </Text>
            </div>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
}
