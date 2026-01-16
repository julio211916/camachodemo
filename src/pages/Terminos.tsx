import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { FileText, AlertCircle, CreditCard, Calendar, Scale, Phone } from "lucide-react";

const Terminos = () => {
  const sections = [
    {
      icon: FileText,
      title: "1. Aceptación de Términos",
      content: `Al utilizar los servicios de NovellDent Clínica Dental, aceptas estos términos y condiciones en su totalidad. 
      Si no estás de acuerdo con alguno de estos términos, por favor no utilices nuestros servicios.
      
      Estos términos pueden ser modificados en cualquier momento, y es tu responsabilidad revisarlos periódicamente.`
    },
    {
      icon: Calendar,
      title: "2. Citas y Cancelaciones",
      content: `Las citas deben programarse con al menos 24 horas de anticipación.
      
      Para cancelar o reprogramar una cita, se requiere un aviso mínimo de 24 horas. Las cancelaciones con menos tiempo pueden estar sujetas a un cargo del 50% del valor de la consulta.
      
      La llegada tardía de más de 15 minutos puede resultar en la reprogramación de tu cita.
      
      Nos reservamos el derecho de cancelar citas por causas de fuerza mayor, ofreciendo reprogramación sin costo.`
    },
    {
      icon: CreditCard,
      title: "3. Pagos y Facturación",
      content: `Aceptamos pagos en efectivo, tarjetas de crédito/débito, transferencias bancarias y planes de financiamiento.
      
      Los presupuestos son válidos por 30 días naturales desde su emisión.
      
      Para tratamientos extensos, se requiere un anticipo del 50% antes de iniciar.
      
      Las facturas se emiten dentro de los 5 días siguientes al pago, conforme a las disposiciones fiscales vigentes.`
    },
    {
      icon: AlertCircle,
      title: "4. Tratamientos y Consentimiento",
      content: `Antes de cualquier tratamiento, recibirás información completa sobre el procedimiento, riesgos y alternativas.
      
      Se requiere la firma de un consentimiento informado para procedimientos quirúrgicos y tratamientos mayores.
      
      Los resultados de los tratamientos pueden variar según las condiciones individuales de cada paciente.
      
      Es obligación del paciente informar sobre condiciones médicas, alergias y medicamentos que esté tomando.`
    },
    {
      icon: Scale,
      title: "5. Garantías y Responsabilidades",
      content: `Ofrecemos garantía de 5 años en implantes dentales, sujeta a seguimiento regular.
      
      Las prótesis dentales tienen garantía de 1 año por defectos de fabricación.
      
      La garantía no cubre daños por mal uso, accidentes o falta de seguimiento del tratamiento.
      
      No nos hacemos responsables por complicaciones derivadas del incumplimiento de las indicaciones post-tratamiento.`
    },
    {
      icon: Phone,
      title: "6. Comunicaciones",
      content: `Al proporcionar tus datos de contacto, autorizas el envío de:
      - Recordatorios de citas por SMS, WhatsApp o correo electrónico
      - Información sobre promociones y servicios (puedes darte de baja en cualquier momento)
      - Comunicaciones relacionadas con tu tratamiento
      
      Tus datos de contacto serán tratados conforme a nuestro Aviso de Privacidad.`
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <NewHeader />
      <main className="pt-24 pb-16">
        <div className="container-wide section-padding">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Términos y <span className="text-primary">Condiciones</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Por favor lee cuidadosamente estos términos antes de utilizar nuestros servicios.
              Tu bienestar y satisfacción son nuestra prioridad.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Vigente desde: 15 de enero de 2026
            </p>
          </motion.div>

          <div className="grid gap-8 max-w-4xl mx-auto">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 md:p-8 shadow-lg"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">{section.title}</h2>
                </div>
                <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 p-6 bg-muted/50 rounded-2xl max-w-4xl mx-auto"
          >
            <h3 className="font-bold mb-2">Jurisdicción Aplicable</h3>
            <p className="text-muted-foreground text-sm">
              Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. 
              Cualquier controversia será sometida a los tribunales competentes de la ciudad de Tepic, Nayarit, 
              renunciando expresamente a cualquier otro fuero que pudiera corresponder por razón de domicilio.
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terminos;
