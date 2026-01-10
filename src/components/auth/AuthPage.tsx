import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, Phone, Loader2, Stethoscope, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo-novelldent.png";

export const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
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
      {/* Theme toggle in corner */}
      <div className="absolute top-4 right-4 z-20">
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
              {isLogin ? "Bienvenido" : "Crear Cuenta"}
            </motion.h1>
            <motion.p 
              className="text-muted-foreground text-sm mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isLogin ? "Accede a tu portal dental" : "Únete a NovellDent"}
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
                Iniciar Sesión
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
                Registrarse
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
                          Paciente
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
                          Doctor
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
                        Nombre completo
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
                    Correo electrónico
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
                      Teléfono <span className="opacity-50">(opcional)</span>
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
                    Contraseña
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
                        {isLogin ? "Continuar" : `Crear cuenta`}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            </AnimatePresence>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground">o continúa con</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Social buttons placeholder */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                className="flex items-center justify-center gap-2 h-12 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all duration-300 text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </motion.button>
              <motion.button
                type="button"
                className="flex items-center justify-center gap-2 h-12 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all duration-300 text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                </svg>
                Apple
              </motion.button>
            </div>
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
            <span>Experiencia dental de primer nivel</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
