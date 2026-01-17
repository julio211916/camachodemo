import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Phone, 
  Mail, 
  MapPin,
  CreditCard,
  Truck
} from "lucide-react";
import logo from "@/assets/logo-camacho.jpg";

export function EcommerceFooter() {
  return (
    <footer className="bg-[hsl(145,35%,15%)] text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <img src={logo} alt="Productos Camacho" className="h-16 w-auto mb-6 rounded-lg" />
            <p className="text-white/70 mb-6">
              Más de 40 años llevando productos naturales y tradicionales mexicanos a tu hogar.
            </p>
            <div className="flex gap-4">
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, y: -2 }}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Enlaces Rápidos</h4>
            <ul className="space-y-3">
              {[
                { name: "Productos", link: "/productos" },
                { name: "Categorías", link: "/productos" },
                { name: "Ofertas", link: "/productos?offers=true" },
                { name: "Nosotros", link: "/#quienes-somos" },
                { name: "Contacto", link: "/#contacto" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.link}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Atención al Cliente</h4>
            <ul className="space-y-3">
              {[
                { name: "Mi Cuenta", link: "/portal" },
                { name: "Mis Pedidos", link: "/portal" },
                { name: "Política de Envío", link: "/terminos" },
                { name: "Devoluciones", link: "/terminos" },
                { name: "Preguntas Frecuentes", link: "/terminos" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.link}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-white/70">
                  Calle Nogales S/N, Ejidos de San Cristóbal, Ecatepec, Edo. México
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <a href="tel:5558357715" className="text-white/70 hover:text-white transition-colors">
                  55 5835 7715
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <a href="mailto:ventas@productoscamacho.com.mx" className="text-white/70 hover:text-white transition-colors">
                  ventas@productoscamacho.com.mx
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods & Shipping */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <CreditCard className="w-4 h-4" />
                <span>Pagos seguros</span>
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Truck className="w-4 h-4" />
                <span>Envío a todo México</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Payment icons would go here */}
              <span className="text-white/40 text-sm">
                Visa • Mastercard • PayPal • OXXO
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
            <p>© {new Date().getFullYear()} Productos Camacho. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <Link to="/privacidad" className="hover:text-white transition-colors">
                Aviso de Privacidad
              </Link>
              <Link to="/terminos" className="hover:text-white transition-colors">
                Términos y Condiciones
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default EcommerceFooter;
