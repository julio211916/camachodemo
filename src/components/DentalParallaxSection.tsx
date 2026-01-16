'use client';

import React, { useEffect } from 'react';
import { ZoomParallax } from '@/components/ui/zoom-parallax';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Star, Leaf } from 'lucide-react';
import Lenis from '@studio-freight/lenis';

const productImages = [
  {
    src: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&h=600&fit=crop&q=80',
    alt: 'Productos naturales de farmacia',
  },
  {
    src: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=600&fit=crop&q=80',
    alt: 'Aceites esenciales naturales',
  },
  {
    src: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=600&fit=crop&q=80',
    alt: 'Pomadas y ungüentos medicinales',
  },
  {
    src: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&h=600&fit=crop&q=80',
    alt: 'Hierbas y botánicos naturales',
  },
  {
    src: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=800&h=600&fit=crop&q=80',
    alt: 'Jarabes naturales para la tos',
  },
  {
    src: 'https://images.unsplash.com/photo-1611241893603-3c359704e0ee?w=800&h=600&fit=crop&q=80',
    alt: 'Productos de rebotica tradicional',
  },
  {
    src: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=600&fit=crop&q=80',
    alt: 'Bienestar natural mexicano',
  },
];

export const DentalParallaxSection = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <section className="relative">
      {/* Hero intro before parallax */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
            >
              <Leaf className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Productos Naturales desde 1985</span>
            </motion.div>

            {/* Main heading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground mb-6"
            >
              Tu{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-500 to-primary">
                Bienestar
              </span>
              <br />
              es Nuestra Prioridad
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Descubre la tradición de la rebotica mexicana con productos naturales de eficacia comprobada
            </motion.p>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center justify-center gap-4 mb-12"
            >
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/50" />
              <span className="text-3xl md:text-4xl font-serif font-bold text-primary">
                Productos Camacho
              </span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/50" />
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-6 mb-12"
            >
              {[
                { icon: Star, text: 'Calidad Garantizada' },
                { icon: Heart, text: 'Ingredientes Naturales' },
                { icon: Sparkles, text: 'Tradición Mexicana' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm"
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{item.text}</span>
                </div>
              ))}
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-sm text-muted-foreground">Desliza para explorar</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Parallax zoom effect */}
      <ZoomParallax images={productImages} />

      {/* Bottom section after parallax */}
      <div className="min-h-[50vh] flex items-center justify-center bg-gradient-to-t from-background to-primary/5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 text-center"
        >
          <h3 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Tradición y Calidad en cada Producto
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Con más de 40 años de experiencia y fórmulas magistrales de la rebotica tradicional,
            cuidamos la salud de las familias mexicanas.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default DentalParallaxSection;
