import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Appointment } from "@/hooks/useAppointments";
import { exportToExcel, exportToCSV } from "@/lib/excelExport";

interface ExportDataProps {
  appointments: Appointment[];
  filteredAppointments?: Appointment[];
}

export const ExportData = ({ appointments, filteredAppointments }: ExportDataProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const dataToExport = filteredAppointments || appointments;

  const formatAppointmentsForExport = () => {
    return dataToExport.map((apt) => ({
      "ID": apt.id,
      "Paciente": apt.patient_name,
      "Email": apt.patient_email,
      "Teléfono": apt.patient_phone,
      "Fecha": format(new Date(apt.appointment_date), "dd/MM/yyyy", { locale: es }),
      "Hora": apt.appointment_time,
      "Sucursal": apt.location_name,
      "Servicio": apt.service_name,
      "Estado": apt.status === "pending" ? "Pendiente" 
        : apt.status === "confirmed" ? "Confirmada" 
        : apt.status === "completed" ? "Completada" 
        : "Cancelada",
      "Confirmada": apt.confirmed_at ? format(new Date(apt.confirmed_at), "dd/MM/yyyy HH:mm", { locale: es }) : "No",
      "Recordatorio Enviado": apt.reminder_sent ? format(new Date(apt.reminder_sent), "dd/MM/yyyy HH:mm", { locale: es }) : "No",
      "Notas": apt.notes || "",
      "Creado": format(new Date(apt.created_at), "dd/MM/yyyy HH:mm", { locale: es }),
    }));
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const data = formatAppointmentsForExport();
      const fileName = `citas_novelldent_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`;
      
      await exportToExcel(data, {
        filename: fileName,
        sheetName: 'Citas',
        columnWidths: [36, 25, 30, 15, 12, 8, 20, 25, 12, 18, 20, 30, 18]
      });
      
      toast.success(`Exportado ${data.length} citas a Excel`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Error al exportar a Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportToCSV = async () => {
    setIsExporting(true);
    try {
      const data = formatAppointmentsForExport();
      const fileName = `citas_novelldent_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`;
      
      exportToCSV(data, fileName);
      
      toast.success(`Exportado ${data.length} citas a CSV`);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast.error("Error al exportar a CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-full" disabled={isExporting || dataToExport.length === 0}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Exportar ({dataToExport.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportToExcel} className="gap-2">
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Exportar a Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportToCSV} className="gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Exportar a CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
