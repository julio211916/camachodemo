import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, MapPin, User, Phone, Mail, CheckCircle2, ChevronRight, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const locations = [
  {
    id: "tepic",
    name: "Matriz Tepic",
    address: "Tepic, Nayarit",
    phone: "+52 311 133 8000",
  },
  {
    id: "marina",
    name: "Marina Nuevo Nayarit",
    address: "Nuevo Vallarta Plaza Business Center, Bahía de Banderas, Nayarit",
    phone: "+52 322 183 7666",
  },
  {
    id: "centro-empresarial",
    name: "Centro Empresarial Nuevo Nayarit",
    address: "Núcleo Médico Joya, Bahía de Banderas, Nayarit",
    phone: "+52 322 183 7666",
  },
  {
    id: "puerto-magico",
    name: "Puerto Mágico Puerto Vallarta",
    address: "Plaza Puerto Mágico, Puerto Vallarta, Jalisco",
    phone: "+52 322 183 7666",
  },
];

const services = [
  { id: "general", name: "Odontología General" },
  { id: "ortodoncia", name: "Ortodoncia" },
  { id: "implantes", name: "Implantes Dentales" },
  { id: "estetica", name: "Estética Dental" },
  { id: "blanqueamiento", name: "Blanqueamiento" },
  { id: "endodoncia", name: "Endodoncia" },
  { id: "periodoncia", name: "Periodoncia" },
  { id: "infantil", name: "Odontopediatría" },
];

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "14:00", "14:30", "15:00",
  "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
];

export const AppointmentBooking = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedLocation && selectedService;
      case 2:
        return selectedDate;
      case 3:
        return selectedTime;
      case 4:
        return formData.name && formData.phone && formData.email;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsComplete(true);
    toast({
      title: "¡Cita agendada!",
      description: "Te hemos enviado un correo de confirmación.",
    });
  };

  const resetForm = () => {
    setStep(1);
    setSelectedLocation("");
    setSelectedService("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setFormData({ name: "", phone: "", email: "" });
    setIsComplete(false);
  };

  const getLocationName = () => locations.find(l => l.id === selectedLocation)?.name || "";
  const getServiceName = () => services.find(s => s.id === selectedService)?.name || "";

  const steps = [
    { number: 1, title: "Sucursal", icon: MapPin },
    { number: 2, title: "Fecha", icon: Calendar },
    { number: 3, title: "Hora", icon: Clock },
    { number: 4, title: "Datos", icon: User },
  ];

  return (
    <section id="reservar" className="section-padding bg-gradient-to-b from-background to-secondary/20" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Reserva Online
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            Agenda tu <span className="gradient-text">cita ahora</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Reserva tu cita en línea de forma rápida y sencilla. Selecciona tu sucursal, fecha y hora preferida.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-10 px-4">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: step >= s.number ? 1 : 0.9,
                    backgroundColor: step >= s.number ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  }}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                    step >= s.number ? "text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground"
                  )}
                >
                  {isComplete && s.number <= 4 ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <s.icon className="w-5 h-5" />
                  )}
                </motion.div>
                {index < steps.length - 1 && (
                  <div className="hidden sm:block w-16 md:w-24 lg:w-32 h-1 mx-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: step > s.number ? "100%" : "0%" }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-primary"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Booking Card */}
          <div className="bg-card rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
            {isComplete ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 md:p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </motion.div>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-4">
                  ¡Cita Confirmada!
                </h3>
                <div className="bg-secondary/50 rounded-2xl p-6 mb-8 max-w-md mx-auto">
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="text-foreground">{getLocationName()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Stethoscope className="w-5 h-5 text-primary" />
                      <span className="text-foreground">{getServiceName()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-foreground">
                        {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="text-foreground">{selectedTime} hrs</span>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  Te hemos enviado un correo de confirmación a <strong>{formData.email}</strong>
                </p>
                <Button onClick={resetForm} className="btn-primary rounded-full">
                  Agendar otra cita
                </Button>
              </motion.div>
            ) : (
              <div className="p-6 md:p-10">
                {/* Step 1: Location & Service */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Selecciona una Sucursal
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {locations.map((location) => (
                          <motion.button
                            key={location.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedLocation(location.id)}
                            className={cn(
                              "p-4 rounded-2xl border-2 text-left transition-all duration-300",
                              selectedLocation === location.id
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                : "border-border/50 hover:border-primary/30 bg-card"
                            )}
                          >
                            <div className="font-semibold text-foreground mb-1">{location.name}</div>
                            <div className="text-sm text-muted-foreground">{location.address}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-primary" />
                        Tipo de Servicio
                      </h3>
                      <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger className="w-full h-14 rounded-xl text-base">
                          <SelectValue placeholder="Selecciona un servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Date */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Selecciona una Fecha
                    </h3>
                    <div className="flex justify-center">
                      <div className="bg-secondary/30 rounded-2xl p-4 inline-block">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          locale={es}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const dayOfWeek = date.getDay();
                            return date < today || dayOfWeek === 0; // Disable past dates and Sundays
                          }}
                          className="rounded-xl pointer-events-auto"
                        />
                      </div>
                    </div>
                    {selectedDate && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                      >
                        <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Time */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Selecciona una Hora
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {timeSlots.map((time) => (
                        <motion.button
                          key={time}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "py-3 px-4 rounded-xl font-medium transition-all duration-300",
                            selectedTime === time
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                              : "bg-secondary/50 text-foreground hover:bg-secondary"
                          )}
                        >
                          {time}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Personal Info */}
                {step === 4 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Tus Datos
                    </h3>

                    {/* Summary */}
                    <div className="bg-secondary/30 rounded-2xl p-5 mb-6">
                      <div className="text-sm text-muted-foreground mb-2">Resumen de tu cita</div>
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-foreground">{getLocationName()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-primary" />
                          <span className="text-foreground">{getServiceName()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="text-foreground">
                            {selectedDate && format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-foreground">{selectedTime} hrs</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Nombre completo
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Tu nombre completo"
                            className="pl-12 h-14 rounded-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Teléfono
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Tu número de teléfono"
                            className="pl-12 h-14 rounded-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="tu@email.com"
                            className="pl-12 h-14 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/50">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={step === 1}
                    className="rounded-full"
                  >
                    Atrás
                  </Button>
                  
                  {step < 4 ? (
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="btn-primary rounded-full"
                    >
                      Continuar
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!canProceed() || isSubmitting}
                      className="btn-primary rounded-full min-w-[180px]"
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          Confirmar Cita
                          <CheckCircle2 className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
