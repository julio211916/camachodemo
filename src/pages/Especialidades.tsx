import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Users, Clock, Star } from "lucide-react";

const especialidades = [
  {
    id: "ortodoncia",
    title: "Ortodoncia",
    subtitle: "Especialista en alineación dental",
    description: "Corregimos la posición de tus dientes y mordida para mejorar tanto la estética como la función de tu sonrisa. Utilizamos tecnología 3D para planificar tu tratamiento con precisión milimétrica.",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop",
    treatments: [
      "Brackets metálicos tradicionales",
      "Brackets estéticos (cerámica y zafiro)",
      "Alineadores invisibles",
      "Ortodoncia lingual",
      "Ortopedia maxilar infantil"
    ],
    specialist: "Dra. María Martínez",
    experience: "12 años de experiencia"
  },
  {
    id: "implantologia",
    title: "Implantología",
    subtitle: "Reemplazo de dientes perdidos",
    description: "Recupera tu sonrisa completa con implantes de titanio de alta calidad. Nuestros implantes se integran perfectamente con tu hueso, proporcionando una base sólida para coronas y prótesis.",
    image: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&auto=format&fit=crop",
    treatments: [
      "Implantes unitarios",
      "Implantes múltiples",
      "All-on-4 / All-on-6",
      "Elevación de seno maxilar",
      "Regeneración ósea"
    ],
    specialist: "Dr. Roberto García",
    experience: "15 años de experiencia"
  },
  {
    id: "endodoncia",
    title: "Endodoncia",
    subtitle: "Tratamiento de conductos",
    description: "Salvamos dientes que de otra manera tendrían que ser extraídos. Mediante técnicas modernas y equipos de última generación, eliminamos la infección del interior del diente de forma indolora.",
    image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop",
    treatments: [
      "Tratamiento de conductos",
      "Retratamiento endodóntico",
      "Apicectomía",
      "Blanqueamiento interno",
      "Tratamiento de traumatismos"
    ],
    specialist: "Dr. Carlos López",
    experience: "10 años de experiencia"
  },
  {
    id: "periodoncia",
    title: "Periodoncia",
    subtitle: "Salud de encías y hueso",
    description: "Especialistas en el tratamiento de enfermedades de las encías y los tejidos de soporte del diente. Prevenimos y tratamos la gingivitis y periodontitis para mantener tus dientes sanos.",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop",
    treatments: [
      "Limpieza profunda (curetaje)",
      "Cirugía periodontal",
      "Injertos de encía",
      "Regeneración tisular guiada",
      "Tratamiento de halitosis"
    ],
    specialist: "Dra. Sofía Rodríguez",
    experience: "8 años de experiencia"
  },
  {
    id: "odontopediatria",
    title: "Odontopediatría",
    subtitle: "Dentista para niños",
    description: "Cuidamos la salud dental de los más pequeños de la casa. Creamos un ambiente amigable y divertido para que los niños disfruten su visita al dentista.",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop",
    treatments: [
      "Prevención y educación dental",
      "Selladores de fosetas y fisuras",
      "Fluoración profesional",
      "Tratamientos pulpares infantiles",
      "Coronas pediátricas"
    ],
    specialist: "Dr. Luis Sánchez",
    experience: "9 años de experiencia"
  },
  {
    id: "estetica",
    title: "Estética Dental",
    subtitle: "Diseño de sonrisa",
    description: "Transformamos tu sonrisa con tratamientos estéticos personalizados. Desde carillas de porcelana hasta blanqueamientos, creamos la sonrisa que siempre soñaste.",
    image: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop",
    treatments: [
      "Carillas de porcelana",
      "Carillas de composite",
      "Blanqueamiento dental",
      "Contorneado estético",
      "Diseño digital de sonrisa (DSD)"
    ],
    specialist: "Dra. María Martínez",
    experience: "12 años de experiencia"
  }
];

const Especialidades = () => {
  return (
    <div className="min-h-screen bg-background">
      <NewHeader />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container-wide section-padding text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              Nuestras <span className="text-primary">Especialidades</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Contamos con un equipo multidisciplinario de especialistas certificados, 
              cada uno experto en su área para brindarte la mejor atención.
            </p>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="container-wide px-4 mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, value: "6", label: "Especialidades" },
              { icon: Award, value: "15+", label: "Años de experiencia" },
              { icon: Star, value: "10,000+", label: "Pacientes satisfechos" },
              { icon: Clock, value: "24/7", label: "Atención de emergencias" }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 text-center shadow-lg"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Especialidades */}
        <section className="container-wide section-padding">
          <div className="space-y-16">
            {especialidades.map((esp, index) => (
              <motion.div
                key={esp.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 items-center`}
              >
                {/* Image */}
                <div className="w-full lg:w-1/2">
                  <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl">
                    <img
                      src={esp.image}
                      alt={esp.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                      <div className="text-white">
                        <p className="font-medium">{esp.specialist}</p>
                        <p className="text-sm opacity-80">{esp.experience}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="w-full lg:w-1/2">
                  <span className="text-primary font-medium text-sm uppercase tracking-wider">
                    {esp.subtitle}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold mt-2 mb-4">
                    {esp.title}
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {esp.description}
                  </p>
                  
                  <div className="bg-muted/50 rounded-2xl p-6 mb-6">
                    <h4 className="font-bold mb-3">Tratamientos que ofrecemos:</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {esp.treatments.map((treatment, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {treatment}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link to="/#cita">
                    <Button className="rounded-full">
                      Agendar con Especialista <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container-wide section-padding mt-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-primary via-primary to-primary/80 rounded-3xl p-8 md:p-12 text-center text-primary-foreground"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              ¿Necesitas una segunda opinión?
            </h2>
            <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Nuestros especialistas están disponibles para evaluar tu caso y darte 
              un diagnóstico preciso con un plan de tratamiento personalizado.
            </p>
            <Link to="/#cita">
              <Button size="lg" variant="secondary" className="rounded-full">
                Consulta de Valoración <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Especialidades;
