import { NewHeader } from "@/components/NewHeader";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";

const Terminos = () => {
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
            Términos y Condiciones
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
                1. Aceptación de Términos
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Al acceder y utilizar este sitio web, usted acepta estar sujeto a estos términos y condiciones de uso. Si no está de acuerdo con alguna parte de estos términos, le solicitamos no utilizar nuestro sitio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-[#1a1f1a] mb-4">
                2. Uso del Sitio
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Este sitio web es para uso personal y no comercial. Queda prohibido utilizar el contenido de este sitio para cualquier propósito ilegal o no autorizado.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-[#1a1f1a] mb-4">
                3. Productos y Precios
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Nos reservamos el derecho de modificar los precios de nuestros productos en cualquier momento sin previo aviso. Todos los precios están expresados en pesos mexicanos (MXN) e incluyen IVA.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-[#1a1f1a] mb-4">
                4. Pedidos y Pagos
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Al realizar un pedido, usted se compromete a proporcionar información precisa y completa. Nos reservamos el derecho de rechazar o cancelar cualquier pedido por cualquier motivo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-[#1a1f1a] mb-4">
                5. Envíos y Entregas
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Los tiempos de entrega son estimados y pueden variar según la ubicación. No nos hacemos responsables por retrasos causados por terceros o circunstancias fuera de nuestro control.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-[#1a1f1a] mb-4">
                6. Devoluciones y Reembolsos
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Aceptamos devoluciones dentro de los 30 días posteriores a la compra, siempre que el producto esté en su empaque original y sin usar. Los gastos de envío de devolución corren por cuenta del cliente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-[#1a1f1a] mb-4">
                7. Propiedad Intelectual
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Todo el contenido de este sitio, incluyendo textos, gráficos, logotipos, imágenes y software, es propiedad de Productos Camacho y está protegido por las leyes de propiedad intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-bold text-[#1a1f1a] mb-4">
                8. Contacto
              </h2>
              <p className="text-gray-700 mb-4">
                Para cualquier pregunta sobre estos términos y condiciones, puede contactarnos a través de:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Email: legal@productoscamacho.com.mx</li>
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

export default Terminos;
