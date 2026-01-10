import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, Phone, Loader2, Stethoscope, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo-novelldent.png";

export const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registerAs, setRegisterAs] = useState<'patient' | 'doctor'>('patient');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isLogin) {
      await signIn(formData.email, formData.password);
    } else {
      await signUp(formData.email, formData.password, formData.fullName, registerAs);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Top bar controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-primary/20 to-transparent blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-accent/20 to-transparent blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Glass card */}
        <div className="backdrop-blur-xl bg-card/80 rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <motion.img 
                src={logo} 
                alt="NovellDent" 
                className="h-14 mx-auto mb-6 drop-shadow-lg cursor-pointer"
                onClick={() => navigate("/")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />
            </motion.div>
            
            {/* Animated gradient title */}
            <motion.h1 
              className="text-3xl font-serif font-bold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] text-transparent bg-clip-text"
              animate={{ backgroundPosition: ["0%", "200%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              {isLogin ? t('auth.welcome') : t('auth.createAccount')}
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-sm mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isLogin ? t('auth.accessPortal') : t('auth.joinUs')}
            </motion.p>
          </div>

          {/* Toggle buttons */}
          <div className="px-8 pb-2">
            <div className="flex bg-muted/50 rounded-2xl p-1.5 backdrop-blur-sm">
              <motion.button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isLogin
                    ? "bg-background text-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                whileHover={{ scale: isLogin ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('auth.login')}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                  !isLogin
                    ? "bg-background text-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                whileHover={{ scale: !isLogin ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t('auth.register')}
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 pt-4">
            <AnimatePresence mode="wait">
              <motion.form
                key={isLogin ? "login" : "register"}
                initial={{ opacity: 0, x: isLogin ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 30 : -30 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {!isLogin && (
                  <>
                    {/* Role Selection */}
                    <motion.div 
                      className="grid grid-cols-2 gap-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <motion.button
                        type="button"
                        onClick={() => setRegisterAs('patient')}
                        className={`group p-4 rounded-2xl border-2 transition-all duration-300 ${
                          registerAs === 'patient'
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                            : 'border-border/50 hover:border-primary/50 hover:bg-muted/50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <User className={`w-6 h-6 mx-auto mb-2 transition-colors ${
                          registerAs === 'patient' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                        }`} />
                        <p className={`text-sm font-medium transition-colors ${
                          registerAs === 'patient' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        }`}>
                          {t('auth.patient')}
                        </p>
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => setRegisterAs('doctor')}
                        className={`group p-4 rounded-2xl border-2 transition-all duration-300 ${
                          registerAs === 'doctor'
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                            : 'border-border/50 hover:border-primary/50 hover:bg-muted/50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Stethoscope className={`w-6 h-6 mx-auto mb-2 transition-colors ${
                          registerAs === 'doctor' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                        }`} />
                        <p className={`text-sm font-medium transition-colors ${
                          registerAs === 'doctor' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        }`}>
                          {t('auth.doctor')}
                        </p>
                      </motion.button>
                    </motion.div>

                    {/* Full Name */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                        {t('auth.fullName')}
                      </label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Dr. Juan García"
                          className="pl-12 h-14 rounded-2xl border-border/50 bg-muted/30 focus:bg-background transition-all duration-300 text-base"
                          required={!isLogin}
                        />
                      </div>
                    </motion.div>
                  </>
                )}

                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: isLogin ? 0.1 : 0.2 }}
                >
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    {t('auth.email')}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tu@email.com"
                      className="pl-12 h-14 rounded-2xl border-border/50 bg-muted/30 focus:bg-background transition-all duration-300 text-base"
                      required
                    />
                  </div>
                </motion.div>

                {/* Phone (only for register) */}
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                      {t('auth.phone')} <span className="opacity-50">(opcional)</span>
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+34 600 000 000"
                        className="pl-12 h-14 rounded-2xl border-border/50 bg-muted/30 focus:bg-background transition-all duration-300 text-base"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: isLogin ? 0.15 : 0.3 }}
                >
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    {t('auth.password')}
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={isLogin ? "••••••••" : "Mínimo 6 caracteres"}
                      className="pl-12 pr-12 h-14 rounded-2xl border-border/50 bg-muted/30 focus:bg-background transition-all duration-300 text-base"
                      required
                      minLength={6}
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </motion.button>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: isLogin ? 0.2 : 0.35 }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl text-base font-semibold relative overflow-hidden group bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary/90 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                  >
                    <motion.span 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        {isLogin ? t('auth.continue') : t('auth.createAccount')}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Sparkles className="w-4 h-4" />
            <span>{t('auth.experience')}</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
