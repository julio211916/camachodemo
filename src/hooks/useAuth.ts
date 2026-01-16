import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'staff' | 'doctor' | 'patient' | 'distributor' | 'customer' | null;

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  address: string | null;
  location_id: string | null;
  is_admin_master: boolean | null;
  referral_code: string | null;
  patient_code: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdminMaster, setIsAdminMaster] = useState(false);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (data && data.length > 0) {
      // Priority: admin > doctor > staff > distributor > customer > patient
      const roles = data.map(r => r.role as string);
      if (roles.includes('admin')) return 'admin' as UserRole;
      if (roles.includes('doctor')) return 'doctor' as UserRole;
      if (roles.includes('staff')) return 'staff' as UserRole;
      if (roles.includes('distributor')) return 'distributor' as UserRole;
      if (roles.includes('customer')) return 'customer' as UserRole;
      if (roles.includes('patient')) return 'patient' as UserRole;
    }
    return null;
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return data as Profile | null;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer database calls to avoid deadlock
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            setUserRole(role);
            
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
            setIsAdminMaster(profileData?.is_admin_master === true);
          }, 0);
        } else {
          setUserRole(null);
          setProfile(null);
          setIsAdminMaster(false);
        }
        
        setLoading(false);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setUserRole(role);
        
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
        setIsAdminMaster(profileData?.is_admin_master === true);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
    
    toast({
      title: "¡Bienvenido!",
      description: "Has iniciado sesión correctamente.",
    });
    
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'patient' | 'doctor' = 'patient') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      toast({
        title: "Error al registrarse",
        description: error.message,
        variant: "destructive",
      });
      return { error, data: null };
    }

    // Assign role to the new user
    if (data.user) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: data.user.id, role });
      
      if (roleError) {
        console.error('Error assigning role:', roleError);
      }
    }
    
    toast({
      title: "¡Registro exitoso!",
      description: "Tu cuenta ha sido creada.",
    });
    
    return { error: null, data };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    setUserRole(null);
    setProfile(null);
    setIsAdminMaster(false);
    
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
    });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
      return { error };
    }

    // Refresh profile
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
    setIsAdminMaster(profileData?.is_admin_master === true);
    setProfile(profileData);

    toast({
      title: "Perfil actualizado",
      description: "Tus datos han sido actualizados.",
    });

    return { error: null };
  };

  // Legacy compatibility
  const isAdmin = userRole === 'admin' || userRole === 'staff';

  return {
    user,
    session,
    loading,
    userRole,
    isAdmin,
    isAdminMaster,
    profile,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
};
