import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Leaf, Award, Shield } from "lucide-react";

// Import product images
import aceiteRomero from "@/assets/products/aceite-romero.png";
import locionTabu from "@/assets/products/locion-tabu.png";
import locionSandalo from "@/assets/products/locion-sandalo.png";
import aceiteCoco from "@/assets/products/aceite-coco-nuevo.png";
import coldCream from "@/assets/products/cold-cream.png";
import aceiteManzanilla from "@/assets/products/aceite-manzanilla.png";

const productImages = [
  { src: aceiteRomero, alt: "Aceite de Romero", name: "Aceite de Romero" },
  { src: locionTabu, alt: "Loción de Tabú", name: "Loción de Tabú" },
  { src: locionSandalo, alt: "Loción de Sándalo", name: "Loción de Sándalo" },
  { src: aceiteCoco, alt: "Aceite de Coco", name: "Aceite de Coco" },
  { src: coldCream, alt: "Cold Cream", name: "Cold Cream" },
  { src: aceiteManzanilla, alt: "Aceite de Manzanilla", name: "Aceite de Manzanilla" },
];

export const ProductSliderSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(nextSlide, 4000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying]);

  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <section className="py-20 bg-gradient-to-b from-[hsl(145,63%,32%)] to-[hsl(145,63%,25%)] overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-6">
            <p className="text-[hsl(145,100%,80%)] font-medium tracking-wider uppercase text-sm">
              Productos Naturales desde 1985
            </p>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Tu Bienestar<br />
              <span className="text-[hsl(145,100%,85%)]">es Nuestra Prioridad</span>
            </h2>
            <p className="text-lg text-white/80 max-w-md">
              Descubre la tradición de la rebotica mexicana con productos naturales de eficacia comprobada
            </p>
            
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Leaf className="h-5 w-5 text-[hsl(145,100%,75%)]" />
                <span className="text-sm font-medium">Productos Camacho</span>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Award className="h-6 w-6 text-[hsl(145,100%,75%)]" />
                </div>
                <span className="text-sm font-medium">Calidad Garantizada</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-[hsl(145,100%,75%)]" />
                </div>
                <span className="text-sm font-medium">Ingredientes Naturales</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Shield className="h-6 w-6 text-[hsl(145,100%,75%)]" />
                </div>
                <span className="text-sm font-medium">Tradición Mexicana</span>
              </div>
            </div>
          </div>

          {/* Right - Product Slider */}
          <div 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative h-[500px] flex items-center justify-center">
              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-0 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              {/* Slider Container */}
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 100, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -100, scale: 0.8 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full transform scale-110" />
                      <img
                        src={productImages[currentIndex].src}
                        alt={productImages[currentIndex].alt}
                        className="relative z-10 h-[400px] w-auto object-contain drop-shadow-2xl"
                      />
                    </div>
                    <p className="text-center text-white font-semibold text-xl mt-4">
                      {productImages[currentIndex].name}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <button
                onClick={nextSlide}
                className="absolute right-0 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {productImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-white w-8"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative text */}
      <div className="mt-12 text-center">
        <p className="text-white/30 text-sm tracking-widest">
          Desliza para explorar
        </p>
      </div>
    </section>
  );
};
