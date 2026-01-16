import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileText, Users, Bell } from "lucide-react";

const Privacidad = () => {
  const sections = [
    {
      icon: Shield,
      title: "Información que Recopilamos",
      content: [
        "Datos de identificación personal (nombre, dirección, teléfono, correo electrónico)",
        "Historial médico y dental para brindar el mejor tratamiento",
        "Información de facturación y pagos",
        "Imágenes clínicas (radiografías, fotografías intraorales)",
        "Preferencias de comunicación y citas"
      ]
    },
    {
      icon: Lock,
      title: "Protección de Datos",
      content: [
        "Utilizamos encriptación SSL/TLS para proteger la transmisión de datos",
        "Almacenamiento seguro en servidores certificados",
        "Acceso restringido solo a personal autorizado",
        "Copias de seguridad regulares y encriptadas",
        "Cumplimiento con la Ley Federal de Protección de Datos Personales (LFPDPPP)"
      ]
    },
    {
      icon: Eye,
      title: "Uso de la Información",
      content: [
        "Programar y gestionar tus citas dentales",
        "Proporcionar diagnósticos y tratamientos personalizados",
        "Enviar recordatorios de citas y seguimientos",
        "Procesar pagos y facturación",
        "Mejorar nuestros servicios y atención al paciente"
      ]
    },
    {
      icon: Users,
      title: "Compartir Información",
      content: [
        "No vendemos ni alquilamos tu información personal a terceros",
        "Podemos compartir datos con laboratorios dentales para elaborar tratamientos",
        "Compartimos información con aseguradoras cuando es requerido",
        "Cooperamos con autoridades cuando la ley lo requiera"
      ]
    },
    {
      icon: Bell,
      title: "Tus Derechos ARCO",
      content: [
        "Acceso: Conocer qué datos tenemos sobre ti",
        "Rectificación: Corregir datos incorrectos o incompletos",
        "Cancelación: Solicitar la eliminación de tus datos",
        "Oposición: Oponerte al tratamiento de tus datos"
      ]
    },
    {
      icon: FileText,
      title: "Cookies y Tecnologías",
      content: [
        "Utilizamos cookies para mejorar tu experiencia en nuestro sitio",
        "Análisis de uso para optimizar nuestros servicios",
        "Puedes configurar tu navegador para rechazar cookies",
        "Las cookies esenciales son necesarias para el funcionamiento del sitio"
      ]
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
              Aviso de <span className="text-primary">Privacidad</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              En NovellDent, proteger tu información personal es nuestra prioridad. 
              Conoce cómo recopilamos, usamos y protegemos tus datos.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Última actualización: 15 de enero de 2026
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
                <ul className="space-y-3">
                  {section.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 text-center"
          >
            <p className="text-muted-foreground mb-4">
              Para ejercer tus derechos ARCO o cualquier consulta sobre privacidad:
            </p>
            <a 
              href="mailto:privacidad@novelldent.com" 
              className="text-primary hover:underline font-medium"
            >
              privacidad@novelldent.com
            </a>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacidad;
