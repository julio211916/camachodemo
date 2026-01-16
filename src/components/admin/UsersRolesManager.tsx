import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserCog,
  Shield,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  Calendar,
  Crown,
  Stethoscope,
  Briefcase,
  User,
  Check,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type AppRole = 'admin' | 'staff' | 'doctor' | 'patient';

interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  location_id: string | null;
  created_at: string;
  role: AppRole;
  is_admin_master: boolean;
}

const roleConfig: Record<AppRole, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  admin: { label: 'Administrador', icon: Crown, color: 'text-amber-600', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  staff: { label: 'Staff', icon: Briefcase, color: 'text-purple-600', bgColor: 'bg-purple-500/10 border-purple-500/20' },
  doctor: { label: 'Doctor', icon: Stethoscope, color: 'text-teal-600', bgColor: 'bg-teal-500/10 border-teal-500/20' },
  patient: { label: 'Paciente', icon: User, color: 'text-blue-600', bgColor: 'bg-blue-500/10 border-blue-500/20' },
};

export function UsersRolesManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole | 'all'>('all');
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('staff');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('staff');

  // Fetch all users with their roles (excluding patients for main view)
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-users-roles'],
    queryFn: async () => {
      // Get all profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          location_id: profile.location_id,
          created_at: profile.created_at,
          role: (userRole?.role as AppRole) || 'patient',
          is_admin_master: profile.is_admin_master || false,
        };
      });

      return usersWithRoles;
    },
  });

  // Fetch locations for assignment
  const { data: locations = [] } = useQuery({
    queryKey: ['locations-for-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First, delete existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-roles'] });
      toast.success('Rol actualizado correctamente');
      setEditingUser(null);
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast.error('Error al actualizar el rol');
    },
  });

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Separate staff users from patients
  const staffUsers = filteredUsers.filter(u => u.role !== 'patient');
  const patientUsers = filteredUsers.filter(u => u.role === 'patient');

  // Stats
  const roleStats = {
    admin: users.filter(u => u.role === 'admin').length,
    staff: users.filter(u => u.role === 'staff').length,
    doctor: users.filter(u => u.role === 'doctor').length,
    patient: users.filter(u => u.role === 'patient').length,
  };

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const RoleBadge = ({ role, isAdminMaster }: { role: AppRole; isAdminMaster?: boolean }) => {
    const config = roleConfig[role];
    const Icon = config.icon;
    return (
      <Badge className={`gap-1 ${config.bgColor} ${config.color} border`}>
        <Icon className="w-3 h-3" />
        {isAdminMaster ? 'Admin Master' : config.label}
      </Badge>
    );
  };

  const UserCard = ({ user }: { user: UserWithRole }) => (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border-2 border-primary/20">
          <AvatarImage src={user.avatar_url || ''} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-foreground">{user.full_name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" />
              {user.phone}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <RoleBadge role={user.role} isAdminMaster={user.is_admin_master} />
        {!user.is_admin_master && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                <Edit className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
                <DialogDescription>
                  Cambiar el rol de {user.full_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback className="text-lg">
                      {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <RoleBadge role={user.role} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Nuevo Rol</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Crown className="w-4 h-4 text-amber-600" />
                          Administrador
                        </div>
                      </SelectItem>
                      <SelectItem value="staff">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-purple-600" />
                          Staff
                        </div>
                      </SelectItem>
                      <SelectItem value="doctor">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-teal-600" />
                          Doctor
                        </div>
                      </SelectItem>
                      <SelectItem value="patient">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          Paciente
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleRoleChange(user.user_id, newRole)}
                  disabled={updateRoleMutation.isPending}
                >
                  {updateRoleMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Usuarios & Roles
          </h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios del sistema y sus permisos
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(roleStats) as AppRole[]).map((role) => {
          const config = roleConfig[role];
          const Icon = config.icon;
          return (
            <Card key={role} className={`${config.bgColor} border cursor-pointer transition-all hover:shadow-md`} onClick={() => setSelectedRole(role)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium opacity-70">{config.label}s</p>
                    <p className={`text-2xl font-bold ${config.color}`}>{roleStats[role]}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-white/50`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole | 'all')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="doctor">Doctores</SelectItem>
                <SelectItem value="patient">Pacientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Tabs */}
      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="staff" className="gap-2">
            <UserCog className="w-4 h-4" />
            Personal ({staffUsers.length})
          </TabsTrigger>
          <TabsTrigger value="patients" className="gap-2">
            <Users className="w-4 h-4" />
            Pacientes ({patientUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCog className="w-4 h-4 text-primary" />
                Personal del Sistema
              </CardTitle>
              <CardDescription>
                Administradores, staff y doctores con acceso al portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : staffUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron usuarios</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {staffUsers.map((user) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Pacientes Registrados
              </CardTitle>
              <CardDescription>
                Usuarios con rol de paciente en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : patientUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron pacientes</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Fecha Registro</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patientUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url || ''} />
                                <AvatarFallback className="text-xs">
                                  {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="text-muted-foreground">{user.phone || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(user.created_at), 'd MMM yyyy', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <RoleBadge role={user.role} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setEditingUser(user);
                                  setNewRole(user.role);
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Cambiar Rol</DialogTitle>
                                  <DialogDescription>
                                    Cambiar el rol de {user.full_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Administrador</SelectItem>
                                      <SelectItem value="staff">Staff</SelectItem>
                                      <SelectItem value="doctor">Doctor</SelectItem>
                                      <SelectItem value="patient">Paciente</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <DialogFooter>
                                  <Button 
                                    onClick={() => handleRoleChange(user.user_id, newRole)}
                                    disabled={updateRoleMutation.isPending}
                                  >
                                    Guardar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UsersRolesManager;
