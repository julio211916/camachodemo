import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/components/auth/AuthPage";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { PatientProvider } from "@/contexts/PatientContext";
import { Loader2 } from "lucide-react";

const Portal = () => {
  const { user, loading, userRole } = useAuth();

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

  // Wrap dashboards with PatientProvider for global patient selection
  const renderDashboard = () => {
    switch (userRole) {
      case 'admin':
      case 'staff':
        return <AdminDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'patient':
      default:
        return <PatientDashboard />;
    }
  };

  return (
    <PatientProvider>
      {renderDashboard()}
    </PatientProvider>
  );
};

export default Portal;
