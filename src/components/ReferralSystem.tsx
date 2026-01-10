import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Gift, 
  Copy, 
  Share2, 
  Users, 
  CheckCircle, 
  Clock, 
  Percent,
  Loader2 
} from "lucide-react";

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  discount_percentage: number;
  discount_amount: number | null;
  completed_at: string | null;
  created_at: string;
}

export const ReferralSystem = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newReferralEmail, setNewReferralEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (user && profile) {
      fetchReferralData();
    }
  }, [user, profile]);

  const fetchReferralData = async () => {
    if (!profile?.email) return;
    
    setIsLoading(true);
    try {
      // Check if user has a referral code
      const { data: existingReferrals } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_email', profile.email)
        .limit(1);

      if (existingReferrals && existingReferrals.length > 0) {
        setReferralCode(existingReferrals[0].referral_code);
      } else {
        // Generate new code
        const { data: codeData } = await supabase.rpc('generate_referral_code');
        if (codeData) {
          setReferralCode(codeData);
        }
      }

      // Fetch all referrals by this user
      const { data: userReferrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_email', profile.email)
        .order('created_at', { ascending: false });

      if (userReferrals) {
        setReferrals(userReferrals as Referral[]);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast({
        title: "¡Código copiado!",
        description: "Compártelo con tus amigos para que obtengan descuento.",
      });
    }
  };

  const shareCode = async () => {
    if (referralCode && navigator.share) {
      try {
        await navigator.share({
          title: 'NovellDent - Código de Referido',
          text: `¡Usa mi código ${referralCode} y obtén 5% de descuento en tu primera cita en NovellDent!`,
          url: window.location.origin,
        });
      } catch (error) {
        copyCode();
      }
    } else {
      copyCode();
    }
  };

  const sendReferral = async () => {
    if (!newReferralEmail || !profile?.email || !referralCode) return;
    
    setIsSending(true);
    try {
      const { error } = await supabase
        .from('referrals')
        .insert({
          referrer_patient_id: user?.id || '',
          referrer_email: profile.email,
          referred_email: newReferralEmail,
          referral_code: referralCode,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Ya existe",
            description: "Ya has referido a este email anteriormente.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "¡Referido enviado!",
          description: `Se ha registrado el referido para ${newReferralEmail}`,
        });
        setNewReferralEmail("");
        fetchReferralData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el referido",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const stats = {
    pending: referrals.filter(r => r.status === 'pending').length,
    completed: referrals.filter(r => r.status === 'completed' || r.status === 'discount_applied').length,
    totalDiscount: referrals
      .filter(r => r.status === 'discount_applied')
      .reduce((acc, r) => acc + (r.discount_amount || 0), 0),
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
        <CardTitle className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Gift className="w-6 h-6 text-primary" />
          </motion.div>
          <div>
            <h3 className="text-xl font-semibold">{t('referrals.title')}</h3>
            <p className="text-sm font-normal text-muted-foreground">{t('referrals.subtitle')}</p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Referral Code Display */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-6 text-center border border-primary/20">
          <p className="text-sm text-muted-foreground mb-2">{t('referrals.yourCode')}</p>
          <motion.div
            className="text-3xl font-mono font-bold text-primary tracking-widest"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            {referralCode || 'Generando...'}
          </motion.div>
          <div className="flex justify-center gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={copyCode}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              Copiar
            </Button>
            <Button
              size="sm"
              onClick={shareCode}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              {t('referrals.share')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-muted/50 rounded-xl p-4 text-center"
          >
            <Clock className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">{t('referrals.pending')}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-muted/50 rounded-xl p-4 text-center"
          >
            <CheckCircle className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">{t('referrals.completed')}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-muted/50 rounded-xl p-4 text-center"
          >
            <Percent className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">${stats.totalDiscount.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">{t('referrals.earned')}</p>
          </motion.div>
        </div>

        {/* Send New Referral */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Invitar a un amigo
          </h4>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email@ejemplo.com"
              value={newReferralEmail}
              onChange={(e) => setNewReferralEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={sendReferral}
              disabled={!newReferralEmail || isSending}
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invitar"}
            </Button>
          </div>
        </div>

        {/* Referral List */}
        {referrals.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Tus referidos</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {referrals.map((referral) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-sm">{referral.referred_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      referral.status === 'discount_applied' ? 'default' :
                      referral.status === 'completed' ? 'secondary' : 'outline'
                    }
                  >
                    {referral.status === 'pending' && '⏳ Pendiente'}
                    {referral.status === 'completed' && '✅ Completado'}
                    {referral.status === 'discount_applied' && '🎉 Aplicado'}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <h4 className="font-medium text-primary mb-2">¿Cómo funciona?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>1. Comparte tu código de referido con amigos</li>
            <li>2. Cuando agendan una cita con tu código, quedan registrados</li>
            <li>3. Al completar su primera cita, recibes 5% de descuento</li>
            <li>4. El descuento se aplica automáticamente en tu próximo pago</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
