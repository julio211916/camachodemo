import { useState } from "react";
import { NewHeader } from "@/components/NewHeader";
import { NewHero } from "@/components/NewHero";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Preloader } from "@/components/Preloader";

const Index = () => {
  const [showPreloader, setShowPreloader] = useState(true);

  return (
    <>
      <Preloader onComplete={() => setShowPreloader(false)} />
      
      <div className={`min-h-screen bg-[#1a1f1a] transition-opacity duration-500 ${showPreloader ? 'opacity-0' : 'opacity-100'}`}>
        <NewHeader />
        <main>
          <NewHero />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );
};

export default Index;
