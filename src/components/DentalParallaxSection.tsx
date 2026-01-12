'use client';

import React, { useEffect } from 'react';
import { ZoomParallax } from '@/components/ui/zoom-parallax';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Star } from 'lucide-react';
import Lenis from '@studio-freight/lenis';

const dentalImages = [
  {
    src: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&h=600&fit=crop&q=80',
    alt: 'Beautiful smile dental care',
  },
  {
    src: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=600&fit=crop&q=80',
    alt: 'Modern dental equipment',
  },
  {
    src: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&h=600&fit=crop&q=80',
    alt: 'Dental CAD CAM technology',
  },
  {
    src: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=800&h=600&fit=crop&q=80',
    alt: 'Professional dental clinic',
  },
  {
    src: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=600&fit=crop&q=80',
    alt: 'Dental treatment room',
  },
  {
    src: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop&q=80',
    alt: 'Happy patient smile',
  },
  {
    src: 'https://images.unsplash.com/photo-1445527815219-ecbfec67492e?w=800&h=600&fit=crop&q=80',
    alt: 'Perfect white teeth smile',
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
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Tecnología CAD/CAM de última generación</span>
            </motion.div>

            {/* Main heading */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground mb-6"
            >
              Tu Mejor{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-500 to-primary">
                Sonrisa
              </span>
              <br />
              en el Mejor Lugar
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Descubre la excelencia dental con tecnología de vanguardia y un equipo comprometido con tu bienestar
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
                NovellDent
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
                { icon: Star, text: 'Tecnología CAD/CAM' },
                { icon: Heart, text: 'Atención Personalizada' },
                { icon: Sparkles, text: 'Resultados Perfectos' },
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
      <ZoomParallax images={dentalImages} />

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
            Transformamos Sonrisas, Cambiamos Vidas
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Con más de 10 años de experiencia y la última tecnología en odontología digital,
            hacemos realidad la sonrisa que siempre soñaste.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default DentalParallaxSection;
