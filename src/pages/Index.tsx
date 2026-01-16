import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TechnologySection } from "@/components/TechnologySection";
import { About } from "@/components/About";
import { Specialties } from "@/components/Specialties";
import { Services } from "@/components/Services";
import { Testimonials } from "@/components/Testimonials";
import { ReviewsSection } from "@/components/ReviewsSection";
import { AppointmentBooking } from "@/components/AppointmentBooking";
import { Locations } from "@/components/Locations";
import { CTA } from "@/components/CTA";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChatBot } from "@/components/ChatBot";
import { Preloader } from "@/components/Preloader";
import { DentalParallaxSection } from "@/components/DentalParallaxSection";

const Index = () => {
  const [showPreloader, setShowPreloader] = useState(true);

  return (
    <>
      <Preloader onComplete={() => setShowPreloader(false)} />
      
      <div className={`min-h-screen bg-background transition-opacity duration-500 ${showPreloader ? 'opacity-0' : 'opacity-100'}`}>
        <Header />
        <main>
          <Hero />
          <TechnologySection />
          <DentalParallaxSection />
          <About />
          <Specialties />
          <Services />
          <Testimonials />
          <ReviewsSection />
          <AppointmentBooking />
          <Locations />
          <CTA />
          <Contact />
        </main>
        <Footer />
        <WhatsAppButton />
        <ChatBot />
      </div>
    </>
  );
};

export default Index;
