import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Send, Phone, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export const Contact = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: t('contact.sent'),
      description: t('contact.sentDesc'),
    });
    
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <section id="contacto" className="section-padding bg-secondary/30" ref={ref}>
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              {t('contact.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
              {t('contact.title')}{" "}
              <span className="gradient-text">{t('contact.titleHighlight')}</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t('contact.subtitle')}
            </p>

            <div className="space-y-6">
              <motion.a
                href="tel:+525555555555"
                whileHover={{ x: 8 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('contact.callUs')}</div>
                  <div className="font-semibold text-foreground">+52 55 5555 5555</div>
                </div>
              </motion.a>

              <motion.a
                href="https://wa.me/525555555555"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ x: 8 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('contact.whatsapp')}</div>
                  <div className="font-semibold text-foreground">+52 55 5555 5555</div>
                </div>
              </motion.a>

              <motion.a
                href="mailto:info@productoscamacho.com.mx"
                whileHover={{ x: 8 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('contact.email')}</div>
                  <div className="font-semibold text-foreground">info@productoscamacho.com.mx</div>
                </div>
              </motion.a>
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            id="cita"
          >
            <div className="bg-card rounded-3xl p-8 md:p-10 border border-border/50 shadow-xl">
              <h3 className="text-2xl font-serif font-bold text-foreground mb-6">
                {t('contact.formTitle')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      {t('contact.name')}
                    </label>
                    <Input
                      required
                      placeholder={t('contact.namePlaceholder')}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      {t('appointments.phone')}
                    </label>
                    <Input
                      required
                      type="tel"
                      placeholder={t('contact.phonePlaceholder')}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {t('contact.email')}
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder={t('contact.emailPlaceholder')}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {t('contact.service')}
                  </label>
                  <Input
                    placeholder={t('contact.servicePlaceholder')}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {t('contact.message')}
                  </label>
                  <Textarea
                    placeholder={t('contact.messagePlaceholder')}
                    className="rounded-xl min-h-[120px]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary rounded-full h-14 text-base"
                >
                  {isSubmitting ? (
                    t('contact.sending')
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {t('contact.send')}
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
