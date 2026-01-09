import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
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

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
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
  );
};

export default Index;
