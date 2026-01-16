import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";

const Privacidad = () => {
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <NewHeader />
      
      {/* Header Banner */}
      <section className="pt-28 pb-12 bg-[#e8e8e0]">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-[#1a1f1a] mb-4"
          >
            Aviso de Privacidad
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600"
          >
            Última actualización: Enero 2024
          </motion.p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto prose prose-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <section>
              <h2 className="text-2xl font-serif font-bold text-[#1a1f1a] mb-4">
                1. Identidad del Responsable
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Productos Camacho S.A. de C.V., con domicilio en Estado de México, México, es responsable de recabar sus datos personales, del uso que se le dé a los mismos y de su protección.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-[#1a1f1a] mb-4">
                2. Datos Personales Recabados
              </h2>
              <p className="text-gray-700 mb-4">
                Para las finalidades señaladas en este aviso de privacidad, podemos recabar los siguientes datos personales:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Nombre completo</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Dirección de envío</li>
                <li>RFC (para facturación)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-[#1a1f1a] mb-4">
                3. Finalidades del Tratamiento
              </h2>
              <p className="text-gray-700 mb-4">
                Sus datos personales serán utilizados para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Procesar sus pedidos y entregas</li>
                <li>Emitir facturas y comprobantes de pago</li>
                <li>Enviar información sobre promociones y nuevos productos</li>
                <li>Atender sus consultas y solicitudes</li>
                <li>Mejorar nuestros servicios</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-[#1a1f1a] mb-4">
                4. Derechos ARCO
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros cuando considere que no está siendo utilizada conforme a los principios, deberes y obligaciones previstas en la normativa (Cancelación); así como oponerse al uso de sus datos personales para fines específicos (Oposición).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-[#1a1f1a] mb-4">
                5. Contacto
              </h2>
              <p className="text-gray-700 mb-4">
                Para ejercer sus derechos ARCO o para cualquier duda sobre el tratamiento de sus datos personales, puede contactarnos a través de:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Email: privacidad@productoscamacho.com.mx</li>
                <li>Teléfono: +52 55 1234 5678</li>
              </ul>
            </section>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacidad;
