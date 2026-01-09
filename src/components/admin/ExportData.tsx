import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
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

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const data = formatAppointmentsForExport();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      
      // Set column widths
      const colWidths = [
        { wch: 36 }, // ID
        { wch: 25 }, // Paciente
        { wch: 30 }, // Email
        { wch: 15 }, // Teléfono
        { wch: 12 }, // Fecha
        { wch: 8 },  // Hora
        { wch: 20 }, // Sucursal
        { wch: 25 }, // Servicio
        { wch: 12 }, // Estado
        { wch: 18 }, // Confirmada
        { wch: 20 }, // Recordatorio
        { wch: 30 }, // Notas
        { wch: 18 }, // Creado
      ];
      worksheet["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Citas");
      
      const fileName = `citas_novelldent_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success(`Exportado ${data.length} citas a Excel`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Error al exportar a Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const data = formatAppointmentsForExport();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `citas_novelldent_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
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
        <DropdownMenuItem onClick={exportToExcel} className="gap-2">
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Exportar a Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Exportar a CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
