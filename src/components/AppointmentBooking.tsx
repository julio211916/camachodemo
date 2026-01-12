import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { format } from "date-fns";
import { es, enUS, pt, ru } from "date-fns/locale";
import { Calendar, Clock, MapPin, User, Phone, Mail, CheckCircle2, ChevronRight, Stethoscope, Loader2, Gift, Tag, Lock, Eye, EyeOff, Sparkles, PartyPopper, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useBookedSlots, useCreateAppointment } from "@/hooks/useAppointments";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

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

const serviceTranslations = {
  es: [
    { id: "general", name: "Odontología General" },
    { id: "ortodoncia", name: "Ortodoncia" },
    { id: "implantes", name: "Implantes Dentales" },
    { id: "estetica", name: "Estética Dental" },
    { id: "blanqueamiento", name: "Blanqueamiento" },
    { id: "endodoncia", name: "Endodoncia" },
    { id: "periodoncia", name: "Periodoncia" },
    { id: "infantil", name: "Odontopediatría" },
  ],
  en: [
    { id: "general", name: "General Dentistry" },
    { id: "ortodoncia", name: "Orthodontics" },
    { id: "implantes", name: "Dental Implants" },
    { id: "estetica", name: "Dental Aesthetics" },
    { id: "blanqueamiento", name: "Whitening" },
    { id: "endodoncia", name: "Endodontics" },
    { id: "periodoncia", name: "Periodontics" },
    { id: "infantil", name: "Pediatric Dentistry" },
  ],
  pt: [
    { id: "general", name: "Odontologia Geral" },
    { id: "ortodoncia", name: "Ortodontia" },
    { id: "implantes", name: "Implantes Dentários" },
    { id: "estetica", name: "Estética Dental" },
    { id: "blanqueamiento", name: "Clareamento" },
    { id: "endodoncia", name: "Endodontia" },
    { id: "periodoncia", name: "Periodontia" },
    { id: "infantil", name: "Odontopediatria" },
  ],
  ru: [
    { id: "general", name: "Общая стоматология" },
    { id: "ortodoncia", name: "Ортодонтия" },
    { id: "implantes", name: "Зубные имплантаты" },
    { id: "estetica", name: "Эстетическая стоматология" },
    { id: "blanqueamiento", name: "Отбеливание" },
    { id: "endodoncia", name: "Эндодонтия" },
    { id: "periodoncia", name: "Пародонтология" },
    { id: "infantil", name: "Детская стоматология" },
  ],
};

// Horarios de mañana y tarde con mejor distribución
const morningSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"];
const afternoonSlots = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"];
const allTimeSlots = [...morningSlots, ...afternoonSlots];

const getDateLocale = (lang: string) => {
  switch (lang) {
    case 'en': return enUS;
    case 'pt': return pt;
    case 'ru': return ru;
    default: return es;
  }
};

export const AppointmentBooking = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const createAppointment = useCreateAppointment();
  const services = serviceTranslations[language] || serviceTranslations.es;
  const dateLocale = getDateLocale(language);

  const [step, setStep] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    referralCode: "",
  });
  const [isComplete, setIsComplete] = useState(false);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [checkingReferral, setCheckingReferral] = useState(false);
  
  // Account creation states
  const [showAccountCreation, setShowAccountCreation] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  // Fetch booked slots for selected location and date
  const { data: bookedSlots = [], isLoading: loadingSlots } = useBookedSlots(selectedLocation, selectedDate);

  // Reset time when date or location changes
  useEffect(() => {
    setSelectedTime("");
  }, [selectedDate, selectedLocation]);

  // Get available time slots (filter out booked ones)
  const availableTimeSlots = allTimeSlots.filter(time => !bookedSlots.includes(time));

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

  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 4) {
      setReferralValid(null);
      return;
    }
    
    setCheckingReferral(true);
    try {
      const { data } = await supabase
        .from('referrals')
        .select('id')
        .eq('referral_code', code.toUpperCase())
        .limit(1);
      
      setReferralValid(data && data.length > 0);
    } catch {
      setReferralValid(false);
    } finally {
      setCheckingReferral(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate) return;

    try {
      await createAppointment.mutateAsync({
        location_id: selectedLocation,
        location_name: getLocationName(),
        service_id: selectedService,
        service_name: getServiceName(),
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        patient_name: formData.name,
        patient_phone: formData.phone,
        patient_email: formData.email,
        referral_code: formData.referralCode || undefined,
      });

      setIsComplete(true);
      toast({
        title: "¡Cita agendada!",
        description: referralValid 
          ? "Te hemos enviado un correo. ¡Tienes 5% de descuento por código de referido!" 
          : "Te hemos enviado un correo de confirmación.",
      });
    } catch (error) {
      // Error handled by the mutation
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedLocation("");
    setSelectedService("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setFormData({ name: "", phone: "", email: "", referralCode: "" });
    setIsComplete(false);
    setReferralValid(null);
    setShowAccountCreation(true);
    setPassword("");
    setAccountCreated(false);
  };

  const handleCreateAccount = async () => {
    if (password.length < 6) {
      toast({
        title: t('common.error') || "Error",
        description: t('confirmation.passwordMinLength') || "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setCreatingAccount(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: formData.name,
          },
        },
      });

      if (error) throw error;

      // Assign patient role
      if (data.user) {
        await supabase.from('user_roles').insert({ 
          user_id: data.user.id, 
          role: 'patient' 
        });
        
        // Create profile
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          email: formData.email,
          full_name: formData.name,
          phone: formData.phone,
        });
      }

      setAccountCreated(true);
      toast({
        title: t('confirmation.accountCreated'),
        description: t('confirmation.accountCreatedDesc'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error') || "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreatingAccount(false);
    }
  };

  const getLocationName = () => locations.find(l => l.id === selectedLocation)?.name || "";
  const getServiceName = () => services.find(s => s.id === selectedService)?.name || "";

  const steps = [
    { number: 1, title: t('appointments.step.branch'), icon: MapPin },
    { number: 2, title: t('appointments.step.date'), icon: Calendar },
    { number: 3, title: t('appointments.step.time'), icon: Clock },
    { number: 4, title: t('appointments.step.data'), icon: User },
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
            {t('appointments.badge')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            {t('appointments.title')} <span className="gradient-text">{t('appointments.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('appointments.subtitle')}
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
            <AnimatePresence mode="wait">
              {isComplete ? (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-8 md:p-12"
                >
                  {accountCreated ? (
                    // Account Created Success Screen
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="relative w-32 h-32 mx-auto mb-8"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-xl"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl">
                          <Sparkles className="w-16 h-16 text-white" />
                        </div>
                      </motion.div>
                      
                      <motion.h3 
                        className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {t('confirmation.accountCreated')}
                      </motion.h3>
                      <motion.p 
                        className="text-muted-foreground mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {t('confirmation.accountCreatedDesc')}
                      </motion.p>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                      >
                        <Button 
                          onClick={() => navigate('/portal')} 
                          className="btn-primary rounded-full min-w-[200px]"
                        >
                          {t('confirmation.goToPortal')}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={resetForm} 
                          className="rounded-full"
                        >
                          {t('appointments.bookAnother')}
                        </Button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    // Appointment Confirmed Screen with Account Creation
                    <div className="text-center">
                      {/* Celebration Animation */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
                        className="relative w-32 h-32 mx-auto mb-8"
                      >
                        <motion.div
                          className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <motion.div 
                          className="relative w-full h-full rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        >
                          <PartyPopper className="w-16 h-16 text-white" />
                        </motion.div>
                        
                        {/* Confetti particles */}
                        {[...Array(12)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-3 h-3 rounded-full"
                            style={{
                              background: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5],
                              left: '50%',
                              top: '50%',
                            }}
                            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                            animate={{
                              x: Math.cos((i * 30 * Math.PI) / 180) * 80,
                              y: Math.sin((i * 30 * Math.PI) / 180) * 80,
                              opacity: 0,
                              scale: 0,
                            }}
                            transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
                          />
                        ))}
                      </motion.div>
                      
                      <motion.h3 
                        className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {t('confirmation.title')}
                      </motion.h3>
                      
                      <motion.p
                        className="text-muted-foreground mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {t('confirmation.subtitle')}
                      </motion.p>

                      {/* Appointment Summary */}
                      <motion.div 
                        className="bg-secondary/50 rounded-2xl p-6 mb-8 max-w-md mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="space-y-3 text-left">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-primary shrink-0" />
                            <span className="text-foreground">{getLocationName()}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Stethoscope className="w-5 h-5 text-primary shrink-0" />
                            <span className="text-foreground">{getServiceName()}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-primary shrink-0" />
                            <span className="text-foreground">
                              {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: dateLocale })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary shrink-0" />
                            <span className="text-foreground">{selectedTime} {t('appointments.hrs')}</span>
                          </div>
                        </div>
                      </motion.div>
                      
                      <motion.p 
                        className="text-muted-foreground mb-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        {t('confirmation.emailSent')} <strong className="text-foreground">{formData.email}</strong>
                      </motion.p>

                      {/* Account Creation Section */}
                      {showAccountCreation && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                          className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-6 max-w-md mx-auto mb-6"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold text-foreground">{t('confirmation.createAccount')}</h4>
                              <p className="text-sm text-muted-foreground">{t('confirmation.createAccountDesc')}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <Input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('confirmation.passwordPlaceholder')}
                                className="pl-12 pr-12 h-14 rounded-xl"
                                minLength={6}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                            
                            <Button
                              onClick={handleCreateAccount}
                              disabled={creatingAccount || password.length < 6}
                              className="w-full h-12 rounded-xl btn-primary"
                            >
                              {creatingAccount ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <>
                                  {t('confirmation.register')}
                                  <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* Action Buttons */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                      >
                        {showAccountCreation && (
                          <Button 
                            variant="ghost" 
                            onClick={() => setShowAccountCreation(false)}
                            className="text-muted-foreground"
                          >
                            {t('confirmation.skipForNow')}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          onClick={resetForm} 
                          className="rounded-full"
                        >
                          {t('appointments.bookAnother')}
                        </Button>
                      </motion.div>
                    </div>
                  )}
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
                        {t('appointments.selectBranch')}
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
                        {t('appointments.serviceType')}
                      </h3>
                      <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger className="w-full h-14 rounded-xl text-base">
                          <SelectValue placeholder={t('appointments.selectService')} />
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
                      {t('appointments.selectDate')}
                    </h3>
                    <div className="flex justify-center">
                      <div className="bg-secondary/30 rounded-2xl p-4 inline-block">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          locale={dateLocale}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const dayOfWeek = date.getDay();
                            return date < today || dayOfWeek === 0;
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
                          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: dateLocale })}
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
                      {t('appointments.selectTime')}
                    </h3>
                    
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="ml-3 text-muted-foreground">{t('appointments.loadingSlots')}</span>
                      </div>
                    ) : availableTimeSlots.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <Clock className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-4">
                          {t('appointments.noSlots')}
                        </p>
                        <Button variant="outline" onClick={handleBack} className="rounded-full">
                          {t('appointments.selectAnotherDate')}
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Turno Mañana */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              ☀️
                            </span>
                            <span>{t('appointments.morning')}</span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {morningSlots.map((time) => {
                              const isBooked = bookedSlots.includes(time);
                              return (
                                <motion.button
                                  key={time}
                                  whileHover={!isBooked ? { scale: 1.03 } : {}}
                                  whileTap={!isBooked ? { scale: 0.97 } : {}}
                                  onClick={() => !isBooked && setSelectedTime(time)}
                                  disabled={isBooked}
                                  className={cn(
                                    "py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-200 relative",
                                    isBooked
                                      ? "bg-muted/50 text-muted-foreground cursor-not-allowed line-through opacity-60"
                                      : selectedTime === time
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                                        : "bg-secondary/50 text-foreground hover:bg-secondary border border-transparent hover:border-primary/20"
                                  )}
                                >
                                  {time}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Turno Tarde */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <span className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                              🌅
                            </span>
                            <span>{t('appointments.afternoon')}</span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {afternoonSlots.map((time) => {
                              const isBooked = bookedSlots.includes(time);
                              return (
                                <motion.button
                                  key={time}
                                  whileHover={!isBooked ? { scale: 1.03 } : {}}
                                  whileTap={!isBooked ? { scale: 0.97 } : {}}
                                  onClick={() => !isBooked && setSelectedTime(time)}
                                  disabled={isBooked}
                                  className={cn(
                                    "py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-200 relative",
                                    isBooked
                                      ? "bg-muted/50 text-muted-foreground cursor-not-allowed line-through opacity-60"
                                      : selectedTime === time
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                                        : "bg-secondary/50 text-foreground hover:bg-secondary border border-transparent hover:border-primary/20"
                                  )}
                                >
                                  {time}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-secondary/50 border border-border" />
                            <span>{t('appointments.available')}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-primary" />
                            <span>{t('appointments.selected')}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-muted/50 line-through" />
                            <span>{t('appointments.booked')}</span>
                          </div>
                        </div>
                      </>
                    )}
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
                      {t('appointments.yourData')}
                    </h3>

                    {/* Summary */}
                    <div className="bg-secondary/30 rounded-2xl p-5 mb-6">
                      <div className="text-sm text-muted-foreground mb-2">{t('appointments.summary')}</div>
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
                            {selectedDate && format(selectedDate, "d 'de' MMMM, yyyy", { locale: dateLocale })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-foreground">{selectedTime} {t('appointments.hrs')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          {t('appointments.fullName')}
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t('appointments.fullNamePlaceholder')}
                            className="pl-12 h-14 rounded-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          {t('appointments.phone')}
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder={t('appointments.phonePlaceholder')}
                            className="pl-12 h-14 rounded-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          {t('appointments.email')}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder={t('appointments.emailPlaceholder')}
                            className="pl-12 h-14 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Referral Code Field */}
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                          <Gift className="w-4 h-4 text-primary" />
                          {t('appointments.referralCode')}
                          <span className="text-xs text-muted-foreground font-normal">{t('appointments.referralOptional')}</span>
                        </label>
                        <div className="relative">
                          <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            value={formData.referralCode}
                            onChange={(e) => {
                              const code = e.target.value.toUpperCase();
                              setFormData({ ...formData, referralCode: code });
                              validateReferralCode(code);
                            }}
                            placeholder={t('appointments.referralPlaceholder')}
                            className={cn(
                              "pl-12 pr-12 h-14 rounded-xl uppercase",
                              referralValid === true && "border-green-500 focus-visible:ring-green-500",
                              referralValid === false && "border-red-500 focus-visible:ring-red-500"
                            )}
                            maxLength={12}
                          />
                          {checkingReferral && (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
                          )}
                          {!checkingReferral && referralValid === true && (
                            <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                          )}
                        </div>
                        {referralValid === true && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-green-600 mt-2 flex items-center gap-1"
                          >
                            <Gift className="w-4 h-4" />
                            {t('appointments.validCode')}
                          </motion.p>
                        )}
                        {referralValid === false && formData.referralCode.length >= 4 && (
                          <p className="text-sm text-red-500 mt-2">
                            {t('appointments.invalidCode')}
                          </p>
                        )}
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
                    {t('appointments.back')}
                  </Button>
                  
                  {step < 4 ? (
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className="btn-primary rounded-full"
                    >
                      {t('appointments.continue')}
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!canProceed() || createAppointment.isPending}
                      className="btn-primary rounded-full min-w-[180px]"
                    >
                      {createAppointment.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {t('appointments.confirm')}
                          <CheckCircle2 className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
