import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard, KanbanColumn, KanbanTask } from "@/components/ui/kanban-board";
import { PageHeader, ContentCard } from "@/components/layout/ContentCard";
import { ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const ClinicKanbanBoard = () => {
  const queryClient = useQueryClient();

  // Fetch appointments
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ["kanban-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Update appointment status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: status as "pending" | "confirmed" | "cancelled" | "completed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-appointments"] });
      toast.success("Estado actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar");
    },
  });

  // Convert appointments to Kanban columns
  const columns: KanbanColumn[] = [
    {
      id: "pending",
      title: "Pendientes",
      tasks: appointments
        .filter((a) => a.status === "pending")
        .map((a) => ({
          id: a.id,
          title: a.patient_name,
          description: `${a.service_name} - ${format(new Date(a.appointment_date), "d MMM", { locale: es })} ${a.appointment_time}`,
          labels: [a.service_name.split(" ")[0]],
          assignee: a.location_name,
        })),
    },
    {
      id: "confirmed",
      title: "Confirmadas",
      tasks: appointments
        .filter((a) => a.status === "confirmed")
        .map((a) => ({
          id: a.id,
          title: a.patient_name,
          description: `${a.service_name} - ${format(new Date(a.appointment_date), "d MMM", { locale: es })} ${a.appointment_time}`,
          labels: [a.service_name.split(" ")[0]],
          assignee: a.location_name,
        })),
    },
    {
      id: "completed",
      title: "Completadas",
      tasks: appointments
        .filter((a) => a.status === "completed")
        .map((a) => ({
          id: a.id,
          title: a.patient_name,
          description: `${a.service_name} - ${format(new Date(a.appointment_date), "d MMM", { locale: es })} ${a.appointment_time}`,
          labels: [a.service_name.split(" ")[0]],
          assignee: a.location_name,
        })),
    },
    {
      id: "cancelled",
      title: "Canceladas",
      tasks: appointments
        .filter((a) => a.status === "cancelled")
        .map((a) => ({
          id: a.id,
          title: a.patient_name,
          description: `${a.service_name} - ${format(new Date(a.appointment_date), "d MMM", { locale: es })} ${a.appointment_time}`,
          labels: [a.service_name.split(" ")[0]],
          assignee: a.location_name,
        })),
    },
  ];

  const columnColors: Record<string, string> = {
    pending: "bg-amber-500",
    confirmed: "bg-blue-500",
    completed: "bg-emerald-500",
    cancelled: "bg-red-500",
  };

  const labelColors: Record<string, string> = {
    limpieza: "bg-cyan-500",
    blanqueamiento: "bg-violet-500",
    ortodoncia: "bg-pink-500",
    endodoncia: "bg-orange-500",
    implante: "bg-emerald-500",
    extracción: "bg-red-500",
    consulta: "bg-blue-500",
  };

  const handleTaskMove = (taskId: string, fromColumnId: string, toColumnId: string) => {
    updateStatus.mutate({ id: taskId, status: toColumnId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Tablero Kanban"
          subtitle="Gestiona el flujo de citas arrastrando las tarjetas"
        />
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <ContentCard className="overflow-x-auto">
        <KanbanBoard
          columns={columns}
          onTaskMove={handleTaskMove}
          columnColors={columnColors}
          labelColors={labelColors}
          allowAddTask={false}
        />
      </ContentCard>
    </div>
  );
};
