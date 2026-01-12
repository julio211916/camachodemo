"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type Review = {
  id: string | number;
  name: string;
  affiliation: string;
  quote: string;
  imageSrc: string;
  thumbnailSrc: string;
};

interface TestimonialSliderProps {
  reviews: Review[];
  className?: string;
}

export const TestimonialSlider = ({
  reviews,
  className,
}: TestimonialSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const activeReview = reviews[currentIndex];

  const handleNext = () => {
    setDirection("right");
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrev = () => {
    setDirection("left");
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleThumbnailClick = (index: number) => {
    setDirection(index > currentIndex ? "right" : "left");
    setCurrentIndex(index);
  };

  const thumbnailReviews = reviews
    .filter((_, i) => i !== currentIndex)
    .slice(0, 3);

  const imageVariants = {
    enter: (direction: "left" | "right") => ({
      y: direction === "right" ? "100%" : "-100%",
      opacity: 0,
    }),
    center: { y: 0, opacity: 1 },
    exit: (direction: "left" | "right") => ({
      y: direction === "right" ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  const textVariants = {
    enter: (direction: "left" | "right") => ({
      x: direction === "right" ? 50 : -50,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: "left" | "right") => ({
      x: direction === "right" ? -50 : 50,
      opacity: 0,
    }),
  };

  return (
    <div className={cn("w-full overflow-hidden bg-background py-12 md:py-20", className)}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
          {/* Left Column: Meta and Thumbnails */}
          <div className="md:col-span-2 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-4 md:gap-8">
            <div className="flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-4">
              <span className="text-3xl md:text-4xl font-bold text-foreground">
                {String(currentIndex + 1).padStart(2, "0")} /{" "}
                {String(reviews.length).padStart(2, "0")}
              </span>
              <span className="hidden md:block text-xs font-semibold uppercase tracking-widest text-muted-foreground md:origin-top-left md:-rotate-90 md:translate-y-full md:mt-16">
                Reviews
              </span>
            </div>

            <div className="flex flex-row md:flex-col gap-2 md:gap-3">
              {thumbnailReviews.map((review) => {
                const originalIndex = reviews.findIndex(
                  (r) => r.id === review.id
                );
                return (
                  <button
                    key={review.id}
                    onClick={() => handleThumbnailClick(originalIndex)}
                    className="overflow-hidden rounded-md w-16 h-20 md:w-20 md:h-24 opacity-70 hover:opacity-100 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                    aria-label={`View review from ${review.name}`}
                  >
                    <img
                      src={review.thumbnailSrc}
                      alt={review.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Column: Main Image */}
          <div className="md:col-span-4 relative h-[400px] md:h-[500px] w-full overflow-hidden rounded-2xl">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.img
                key={activeReview.id}
                src={activeReview.imageSrc}
                alt={activeReview.name}
                custom={direction}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
          </div>

          {/* Right Column: Text and Navigation */}
          <div className="md:col-span-6 flex flex-col justify-between h-full py-4">
            <div className="relative min-h-[200px] md:min-h-[250px]">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={activeReview.id}
                  custom={direction}
                  variants={textVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-4"
                >
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                    {activeReview.affiliation}
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground font-serif">
                    {activeReview.name}
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    "{activeReview.quote}"
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="rounded-full h-12 w-12 border-border hover:bg-accent"
                aria-label="Previous review"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="rounded-full h-12 w-12 border-border hover:bg-accent"
                aria-label="Next review"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
