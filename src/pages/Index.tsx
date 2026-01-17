import { useState } from "react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { CamachoHero } from "@/components/ecommerce/CamachoHero";
import { CategorySection } from "@/components/ecommerce/CategorySection";
import { FeaturedProducts } from "@/components/ecommerce/FeaturedProducts";
import { PromoSection } from "@/components/ecommerce/PromoSection";
import { About } from "@/components/About";
import { Locations } from "@/components/Locations";
import { Contact } from "@/components/Contact";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChatBot } from "@/components/ChatBot";
import { Preloader } from "@/components/Preloader";
import { CartSidebar } from "@/components/ecommerce/CartSidebar";

const Index = () => {
  const [showPreloader, setShowPreloader] = useState(true);

  return (
    <>
      <Preloader onComplete={() => setShowPreloader(false)} />
      
      <div className={`min-h-screen bg-background transition-opacity duration-500 ${showPreloader ? 'opacity-0' : 'opacity-100'}`}>
        <EcommerceHeader />
        <main>
          <CamachoHero />
          <PromoSection />
          <CategorySection />
          <FeaturedProducts />
          <About />
          <Locations />
          <Contact />
        </main>
        <EcommerceFooter />
        <WhatsAppButton />
        <ChatBot />
        <CartSidebar />
      </div>
    </>
  );
};

export default Index;
