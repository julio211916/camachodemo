import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import logo from "@/assets/logo-camacho.jpg";

interface PreloaderProps {
  onComplete?: () => void;
}

export const Preloader = ({ onComplete }: PreloaderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsLoading(false);
            onComplete?.();
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-primary/10 blur-[100px]"
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-accent/10 blur-[100px]"
              animate={{
                x: [0, -100, 0],
                y: [0, -50, 0],
                scale: [1.2, 1, 1.2],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              delay: 0.2 
            }}
            className="relative z-10"
          >
            <motion.img
              src={logo}
              alt="Productos Camacho"
              className="h-24 w-auto rounded-xl drop-shadow-2xl"
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Animated title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-2xl font-serif font-bold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] text-transparent bg-clip-text relative z-10"
            style={{
              animation: "gradient 3s linear infinite",
            }}
          >
            Productos Camacho
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-2 text-muted-foreground text-sm relative z-10"
          >
            Tradición desde 1985
          </motion.p>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 200 }}
            transition={{ delay: 0.8 }}
            className="mt-8 h-1 bg-muted rounded-full overflow-hidden relative z-10"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          {/* Loading text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 flex items-center gap-2 text-sm text-muted-foreground relative z-10"
          >
            <motion.div
              className="flex gap-1"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animation-delay-200" />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animation-delay-400" />
            </motion.div>
            <span>Cargando productos naturales</span>
          </motion.div>

          {/* Floating icons */}
          {['🌿', '💧', '🌸'].map((emoji, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl opacity-30"
              initial={{ 
                x: Math.random() * 400 - 200, 
                y: Math.random() * 400 - 200,
                scale: 0 
              }}
              animate={{ 
                y: [0, -20, 0],
                scale: 1,
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
              style={{
                left: `${20 + i * 30}%`,
                top: `${30 + i * 15}%`,
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
