import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Smile, 
  Shield, 
  Stethoscope, 
  Heart, 
  Star,
  ArrowRight,
  Clock,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

const servicios = [
  {
    id: "limpieza",
    icon: Sparkles,
    title: "Limpieza Dental Profesional",
    description: "Eliminamos placa, sarro y manchas para una sonrisa brillante y saludable.",
    duration: "45-60 min",
    features: [
      "Ultrasonido para eliminación de sarro",
      "Pulido con pasta profiláctica",
      "Aplicación de flúor",
      "Evaluación de encías"
    ],
    price: "Desde $800 MXN"
  },
  {
    id: "blanqueamiento",
    icon: Star,
    title: "Blanqueamiento Dental",
    description: "Aclara el tono de tus dientes hasta 8 tonos con tecnología LED de última generación.",
    duration: "60-90 min",
    features: [
      "Tecnología LED segura",
      "Resultados inmediatos",
      "Gel blanqueador profesional",
      "Kit de mantenimiento incluido"
    ],
    price: "Desde $4,500 MXN"
  },
  {
    id: "ortodoncia",
    icon: Smile,
    title: "Ortodoncia",
    description: "Corrige la posición de tus dientes con brackets tradicionales o alineadores invisibles.",
    duration: "12-24 meses",
    features: [
      "Brackets metálicos y estéticos",
      "Alineadores transparentes",
      "Seguimiento mensual",
      "Retenedores incluidos"
    ],
    price: "Desde $25,000 MXN"
  },
  {
    id: "implantes",
    icon: Shield,
    title: "Implantes Dentales",
    description: "Reemplaza dientes perdidos con implantes de titanio de alta calidad.",
    duration: "3-6 meses (proceso completo)",
    features: [
      "Implantes de titanio grado médico",
      "Corona de porcelana premium",
      "Garantía de 5 años",
      "Cirugía mínimamente invasiva"
    ],
    price: "Desde $18,000 MXN"
  },
  {
    id: "endodoncia",
    icon: Stethoscope,
    title: "Endodoncia (Tratamiento de Conducto)",
    description: "Salva tu diente natural eliminando la infección del nervio dental.",
    duration: "1-2 sesiones",
    features: [
      "Anestesia local indolora",
      "Limpieza y sellado del conducto",
      "Radiografías digitales",
      "Seguimiento post-tratamiento"
    ],
    price: "Desde $3,500 MXN"
  },
  {
    id: "estetica",
    icon: Heart,
    title: "Estética Dental",
    description: "Carillas, coronas y reconstrucciones para una sonrisa perfecta.",
    duration: "Variable",
    features: [
      "Carillas de porcelana",
      "Coronas cerámicas",
      "Diseño digital de sonrisa",
      "Resultados naturales"
    ],
    price: "Consultar"
  }
];

const Servicios = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container-wide section-padding text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              Nuestros <span className="text-primary">Servicios</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Ofrecemos una gama completa de tratamientos dentales con tecnología de vanguardia 
              y un equipo de especialistas comprometidos con tu sonrisa.
            </p>
            <Link to="/portal">
              <Button size="lg" className="rounded-full">
                Agenda tu Cita <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Services Grid */}
        <section className="container-wide section-padding">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicios.map((servicio, index) => (
              <motion.div
                key={servicio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-card rounded-3xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <servicio.icon className="w-7 h-7 text-primary" />
                </div>
                
                <h3 className="text-xl font-bold mb-3">{servicio.title}</h3>
                <p className="text-muted-foreground mb-4">{servicio.description}</p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock className="w-4 h-4" />
                  <span>{servicio.duration}</span>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {servicio.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="font-bold text-primary">{servicio.price}</span>
                  <Link to="/portal">
                    <Button variant="outline" size="sm" className="rounded-full">
                      Agendar
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container-wide section-padding mt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-8 md:p-12 text-center text-primary-foreground"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              ¿No estás seguro qué tratamiento necesitas?
            </h2>
            <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Agenda una consulta de valoración sin costo. Nuestros especialistas evaluarán 
              tu caso y te darán un plan de tratamiento personalizado.
            </p>
            <Link to="/#cita">
              <Button size="lg" variant="secondary" className="rounded-full">
                Valoración Gratis <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Servicios;
