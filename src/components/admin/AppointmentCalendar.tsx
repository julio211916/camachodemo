import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  parseISO,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Appointment } from "@/hooks/useAppointments";

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onSelectAppointment?: (appointment: Appointment) => void;
}

const statusColors = {
  pending: "bg-yellow-500",
  confirmed: "bg-green-500",
  completed: "bg-blue-500",
  cancelled: "bg-red-500",
};

export const AppointmentCalendar = ({
  appointments,
  onSelectAppointment,
}: AppointmentCalendarProps) => {
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const days = useMemo(() => {
    if (view === "week") {
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      const start = startOfWeek(monthStart, { weekStartsOn: 1 });
      const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  }, [view, currentDate]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 7pm

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) =>
      isSameDay(parseISO(apt.appointment_date), day)
    );
  };

  const navigate = (direction: "prev" | "next") => {
    if (view === "week") {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("prev")} className="rounded-full">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("next")} className="rounded-full">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {view === "week"
              ? `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM yyyy", { locale: es })}`
              : format(currentDate, "MMMM yyyy", { locale: es })}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={goToToday} className="rounded-full">
            Hoy
          </Button>
          <Tabs value={view} onValueChange={(v) => setView(v as "week" | "month")}>
            <TabsList className="rounded-full">
              <TabsTrigger value="week" className="rounded-full">Semana</TabsTrigger>
              <TabsTrigger value="month" className="rounded-full">Mes</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-auto max-h-[600px]">
        {view === "week" ? (
          /* Weekly View */
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border/50 sticky top-0 bg-card z-10">
              <div className="p-3 border-r border-border/50" />
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-3 text-center border-r border-border/50 last:border-r-0",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE", { locale: es })}
                  </div>
                  <div
                    className={cn(
                      "text-lg font-semibold mt-1",
                      isToday(day) ? "text-primary" : "text-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border/30 last:border-b-0"
              >
                <div className="p-2 text-xs text-muted-foreground text-right border-r border-border/50">
                  {format(new Date().setHours(hour, 0), "HH:mm")}
                </div>
                {days.map((day) => {
                  const dayAppointments = getAppointmentsForDay(day).filter(
                    (apt) => parseInt(apt.appointment_time.split(":")[0]) === hour
                  );
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "p-1 min-h-[60px] border-r border-border/30 last:border-r-0",
                        isToday(day) && "bg-primary/5"
                      )}
                    >
                      <AnimatePresence>
                        {dayAppointments.map((apt) => (
                          <TooltipProvider key={apt.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  onClick={() => onSelectAppointment?.(apt)}
                                  className={cn(
                                    "p-2 rounded-lg text-xs cursor-pointer transition-all hover:scale-105",
                                    statusColors[apt.status],
                                    "text-white shadow-sm"
                                  )}
                                >
                                  <div className="font-medium truncate">{apt.patient_name}</div>
                                  <div className="opacity-80 truncate">{apt.appointment_time}</div>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <div className="space-y-2">
                                  <div className="font-semibold">{apt.patient_name}</div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-3 h-3" />
                                    {apt.appointment_time}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="w-3 h-3" />
                                    {apt.location_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {apt.service_name}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          /* Monthly View */
          <div className="grid grid-cols-7">
            {/* Day Headers */}
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-xs font-medium text-muted-foreground uppercase border-b border-border/50"
              >
                {day}
              </div>
            ))}

            {/* Days */}
            {days.map((day) => {
              const dayAppointments = getAppointmentsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[100px] p-2 border-b border-r border-border/30",
                    !isCurrentMonth && "bg-muted/30",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm mb-2",
                      isToday(day)
                        ? "w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                        : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => onSelectAppointment?.(apt)}
                        className={cn(
                          "px-2 py-1 rounded text-xs cursor-pointer truncate",
                          statusColors[apt.status],
                          "text-white"
                        )}
                      >
                        {apt.appointment_time} - {apt.patient_name}
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{dayAppointments.length - 3} más
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border/50 flex items-center gap-6 flex-wrap">
        <span className="text-sm text-muted-foreground">Estado:</span>
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", color)} />
            <span className="text-sm capitalize">{status === "pending" ? "Pendiente" : status === "confirmed" ? "Confirmada" : status === "completed" ? "Completada" : "Cancelada"}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
