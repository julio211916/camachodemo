import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { TestimonialSlider, Review } from "@/components/ui/testimonial-slider";
import { Star, Quote, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const testimoniosDestacados: Review[] = [
  {
    id: '1',
    imageSrc: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
    quote: "Después de años con miedo al dentista, en NovellDent encontré un equipo que me hizo sentir cómoda desde el primer momento. Mi tratamiento de ortodoncia fue impecable.",
    name: 'Ana María González',
    affiliation: 'Paciente de Ortodoncia',
  },
  {
    id: '2',
    imageSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    quote: "Los implantes que me colocaron cambiaron mi vida. El Dr. García es un profesional excepcional y el resultado superó todas mis expectativas.",
    name: 'Roberto Mendoza',
    affiliation: 'Paciente de Implantes',
  },
  {
    id: '3',
    imageSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    quote: "El blanqueamiento dental que me hicieron fue increíble. En solo una hora tenía la sonrisa que siempre quise. ¡Muy recomendado!",
    name: 'Laura Jiménez',
    affiliation: 'Paciente de Estética',
  },
  {
    id: '4',
    imageSrc: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800&auto=format&fit=crop',
    thumbnailSrc: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop',
    quote: "Excelente atención para mi hija de 6 años. El ambiente es muy amigable para niños y la Dra. Rodríguez tiene una paciencia increíble.",
    name: 'Carlos Hernández',
    affiliation: 'Padre de Paciente Pediátrico',
  }
];

const testimoniosAdicionales = [
  {
    name: "María Teresa López",
    location: "Tepic, Nayarit",
    rating: 5,
    treatment: "Limpieza y Blanqueamiento",
    quote: "La limpieza más profesional que he tenido. El personal es muy amable y las instalaciones están impecables."
  },
  {
    name: "Fernando Díaz",
    location: "Puerto Vallarta",
    rating: 5,
    treatment: "Endodoncia",
    quote: "Tenía mucho miedo porque pensé que dolería, pero no sentí absolutamente nada. Excelente trabajo."
  },
  {
    name: "Patricia Morales",
    location: "Guadalajara",
    rating: 5,
    treatment: "Carillas de Porcelana",
    quote: "Mis carillas quedaron perfectas y muy naturales. Nadie nota que no son mis dientes reales."
  },
  {
    name: "José Luis Ramírez",
    location: "Bahía de Banderas",
    rating: 5,
    treatment: "Ortodoncia Invisible",
    quote: "Los alineadores son súper cómodos y nadie nota que los traigo puestos. En 8 meses mi sonrisa cambió."
  },
  {
    name: "Carmen Flores",
    location: "Nuevo Vallarta",
    rating: 4,
    treatment: "Corona Dental",
    quote: "Muy satisfecha con mi corona. Se ve completamente natural y la atención fue excelente."
  },
  {
    name: "Miguel Ángel Torres",
    location: "Tepic",
    rating: 5,
    treatment: "Implante Dental",
    quote: "Después de perder un diente en un accidente, el Dr. García me devolvió mi sonrisa completa."
  }
];

const TestimoniosPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <NewHeader />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container-wide section-padding text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              Lo que dicen nuestros <span className="text-primary">Pacientes</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Miles de sonrisas transformadas. Conoce las experiencias de quienes ya 
              confiaron en NovellDent para cuidar su salud dental.
            </p>
          </motion.div>
        </section>

        {/* Featured Slider */}
        <section className="mb-16">
          <TestimonialSlider reviews={testimoniosDestacados} />
        </section>

        {/* Stats */}
        <section className="container-wide px-4 mb-16">
          <div className="bg-primary/5 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">4.9</div>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Calificación promedio</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">1,200+</div>
                <p className="text-sm text-muted-foreground">Reseñas en Google</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">98%</div>
                <p className="text-sm text-muted-foreground">Pacientes satisfechos</p>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">85%</div>
                <p className="text-sm text-muted-foreground">Nos recomiendan</p>
              </div>
            </div>
          </div>
        </section>

        {/* Grid de testimonios */}
        <section className="container-wide section-padding">
          <h2 className="text-3xl font-serif font-bold text-center mb-12">
            Más historias de éxito
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimoniosAdicionales.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < testimonial.rating ? 'fill-primary text-primary' : 'text-muted'}`} 
                    />
                  ))}
                </div>
                <div className="border-t pt-4">
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {testimonial.treatment}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container-wide section-padding mt-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-primary to-primary/80 rounded-3xl p-8 md:p-12 text-center text-primary-foreground"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              ¿Listo para transformar tu sonrisa?
            </h2>
            <p className="text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Únete a los miles de pacientes satisfechos que ya confiaron en nosotros. 
              Tu primera consulta de valoración es sin costo.
            </p>
            <Link to="/#cita">
              <Button size="lg" variant="secondary" className="rounded-full">
                Agenda tu Cita Gratis <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TestimoniosPage;
