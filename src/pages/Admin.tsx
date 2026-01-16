import { useAuth } from "@/hooks/useAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loader2 } from "lucide-react";

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground mb-6">
            Tu cuenta no tiene permisos de administrador. Contacta al administrador para obtener acceso.
          </p>
          <p className="text-sm text-muted-foreground">
            Sesión: {user.email}
          </p>
        </div>
      </div>
    );
  }

  // Usa MainLayout que incluye sucursales y vista local/global
  return <MainLayout />;
};

export default Admin;
