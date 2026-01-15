import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Portal from "./pages/Portal";
import Review from "./pages/Review";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Privacidad from "./pages/Privacidad";
import Terminos from "./pages/Terminos";
import Servicios from "./pages/Servicios";
import Especialidades from "./pages/Especialidades";
import TestimoniosPage from "./pages/TestimoniosPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/portal" element={<Portal />} />
            <Route path="/review" element={<Review />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/privacidad" element={<Privacidad />} />
            <Route path="/terminos" element={<Terminos />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/especialidades" element={<Especialidades />} />
            <Route path="/testimonios" element={<TestimoniosPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
