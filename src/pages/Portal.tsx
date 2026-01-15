import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/components/auth/AuthPage";
import { MainLayout } from "@/components/layout/MainLayout";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { Loader2 } from "lucide-react";

const Portal = () => {
  const { user, loading, userRole, isAdminMaster, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Route to different dashboards based on role
  switch (userRole) {
    case 'patient':
      return <PatientDashboard />;
    
    case 'doctor':
      return <DoctorDashboard />;
    
    case 'admin':
    case 'staff':
      // MainLayout handles admin_master vs admin_sucursal internally
      return <MainLayout />;
    
    default:
      // Default to patient dashboard if no role assigned
      return <PatientDashboard />;
  }
};

export default Portal;
