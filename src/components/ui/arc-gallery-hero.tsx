'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type ArcGalleryHeroProps = {
  images: string[];
  startAngle?: number;
  endAngle?: number;
  radiusLg?: number;
  radiusMd?: number;
  radiusSm?: number;
  cardSizeLg?: number;
  cardSizeMd?: number;
  cardSizeSm?: number;
  className?: string;
  children?: React.ReactNode;
};

export const ArcGalleryHero: React.FC<ArcGalleryHeroProps> = ({
  images,
  startAngle = 20,
  endAngle = 160,
  radiusLg = 480,
  radiusMd = 360,
  radiusSm = 260,
  cardSizeLg = 120,
  cardSizeMd = 100,
  cardSizeSm = 80,
  className = '',
  children,
}) => {
  const [dimensions, setDimensions] = useState({
    radius: radiusLg,
    cardSize: cardSizeLg,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDimensions({ radius: radiusSm, cardSize: cardSizeSm });
      } else if (width < 1024) {
        setDimensions({ radius: radiusMd, cardSize: cardSizeMd });
      } else {
        setDimensions({ radius: radiusLg, cardSize: cardSizeLg });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [radiusLg, radiusMd, radiusSm, cardSizeLg, cardSizeMd, cardSizeSm]);

  const count = Math.max(images.length, 2);
  const step = (endAngle - startAngle) / (count - 1);

  return (
    <section className={`relative w-full min-h-screen overflow-hidden bg-gradient-to-b from-[hsl(140,35%,25%)] via-[hsl(145,40%,20%)] to-[hsl(150,45%,15%)] ${className}`}>
      {/* Decorative plant elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-20 top-0 w-80 h-96 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400')] bg-contain bg-no-repeat opacity-20" />
        <div className="absolute -right-20 top-10 w-80 h-96 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400')] bg-contain bg-no-repeat opacity-20 scale-x-[-1]" />
        <div className="absolute left-10 bottom-20 w-60 h-80 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400')] bg-contain bg-no-repeat opacity-15" />
        <div className="absolute right-10 bottom-10 w-60 h-80 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400')] bg-contain bg-no-repeat opacity-15 scale-x-[-1]" />
      </div>

      {/* Arc container */}
      <div
        className="absolute left-1/2 bottom-[40%] sm:bottom-[35%]"
        style={{
          width: dimensions.radius * 2,
          height: dimensions.radius,
          transform: 'translateX(-50%)',
        }}
      >
        {/* Center pivot */}
        <div
          className="absolute left-1/2 bottom-0"
          style={{ transform: 'translateX(-50%)' }}
        >
          {images.map((src, i) => {
            const angle = startAngle + step * i;
            const angleRad = (angle * Math.PI) / 180;
            const x = Math.cos(angleRad) * dimensions.radius;
            const y = Math.sin(angleRad) * dimensions.radius;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="absolute"
                style={{
                  width: dimensions.cardSize,
                  height: dimensions.cardSize * 1.3,
                  left: x,
                  bottom: y,
                  transform: `translate(-50%, 50%) rotate(${angle - 90}deg)`,
                }}
              >
                <motion.div 
                  whileHover={{ scale: 1.15, y: -10 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm cursor-pointer"
                >
                  <img
                    src={src}
                    alt={`Product ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x500/2d5a3d/ffffff?text=Producto`;
                    }}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="absolute left-1/2 top-[55%] sm:top-[50%] transform -translate-x-1/2 -translate-y-1/2 z-10 text-center px-4 w-full max-w-4xl">
        {children}
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default ArcGalleryHero;
