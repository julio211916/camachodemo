import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, LogIn, Lock, Mail, User, Phone, Loader2, UserPlus, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logo from "@/assets/logo-novelldent.png";

export const AuthPage = () => {
  const { signIn, signUp } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-8 text-center">
            <img src={logo} alt="NovellDent" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-primary-foreground">
              NovellDent
            </h1>
            <p className="text-primary-foreground/80 text-sm mt-2">
              Sistema de Gestión Dental
            </p>
          </div>

          {/* Tabs */}
          <div className="p-6">
            <Tabs value={isLogin ? "login" : "register"} onValueChange={(v) => setIsLogin(v === "login")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="register" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.form
                  key={isLogin ? "login" : "register"}
                  initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <TabsContent value="login" className="m-0 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Correo electrónico
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="tu@email.com"
                          className="pl-12 h-12 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          className="pl-12 pr-12 h-12 rounded-xl"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="register" className="m-0 space-y-4">
                    {/* Role Selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegisterAs('patient')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          registerAs === 'patient'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <User className={`w-6 h-6 mx-auto mb-2 ${registerAs === 'patient' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className={`text-sm font-medium ${registerAs === 'patient' ? 'text-primary' : 'text-muted-foreground'}`}>
                          Paciente
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegisterAs('doctor')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          registerAs === 'doctor'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Stethoscope className={`w-6 h-6 mx-auto mb-2 ${registerAs === 'doctor' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className={`text-sm font-medium ${registerAs === 'doctor' ? 'text-primary' : 'text-muted-foreground'}`}>
                          Doctor
                        </p>
                      </button>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Nombre completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Dr. Juan García"
                          className="pl-12 h-12 rounded-xl"
                          required={!isLogin}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Correo electrónico
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="tu@email.com"
                          className="pl-12 h-12 rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Teléfono (opcional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+34 600 000 000"
                          className="pl-12 h-12 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Mínimo 6 caracteres"
                          className="pl-12 pr-12 h-12 rounded-xl"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </TabsContent>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary h-12 rounded-xl"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {isLogin ? <LogIn className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                        {isLogin ? "Iniciar Sesión" : `Registrarse como ${registerAs === 'patient' ? 'Paciente' : 'Doctor'}`}
                      </>
                    )}
                  </Button>
                </motion.form>
              </AnimatePresence>
            </Tabs>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Un inicio de sesión para pacientes, doctores y administradores
        </p>
      </motion.div>
    </div>
  );
};
