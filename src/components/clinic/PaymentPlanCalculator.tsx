import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calculator, DollarSign, Calendar, CreditCard, Wallet, PiggyBank,
  ChevronRight, Check, AlertCircle, FileText, Download, Send, Percent
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { format, addMonths, addWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface PaymentPlan {
  id: string;
  name: string;
  totalAmount: number;
  downPayment: number;
  downPaymentPercentage: number;
  numberOfInstallments: number;
  installmentAmount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  interestRate: number;
  totalWithInterest: number;
  startDate: Date;
  installments: Installment[];
}

interface Installment {
  number: number;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: Date;
}

interface PaymentPlanCalculatorProps {
  treatmentTotal: number;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  treatmentPlanId?: string;
  onPlanSelected?: (plan: PaymentPlan) => void;
}

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Semanal', days: 7 },
  { value: 'biweekly', label: 'Quincenal', days: 14 },
  { value: 'monthly', label: 'Mensual', days: 30 },
];

const PRESET_PLANS = [
  { installments: 3, interestRate: 0, label: "3 meses sin intereses" },
  { installments: 6, interestRate: 0, label: "6 meses sin intereses" },
  { installments: 9, interestRate: 5, label: "9 meses (5% interés)" },
  { installments: 12, interestRate: 8, label: "12 meses (8% interés)" },
  { installments: 18, interestRate: 12, label: "18 meses (12% interés)" },
  { installments: 24, interestRate: 15, label: "24 meses (15% interés)" },
];

export const PaymentPlanCalculator = ({
  treatmentTotal,
  patientName = "",
  patientEmail = "",
  patientPhone = "",
  treatmentPlanId,
  onPlanSelected
}: PaymentPlanCalculatorProps) => {
  const { toast } = useToast();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sending, setSending] = useState(false);

  // Plan configuration
  const [downPaymentPercentage, setDownPaymentPercentage] = useState(30);
  const [numberOfInstallments, setNumberOfInstallments] = useState(6);
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [interestRate, setInterestRate] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(1); // Default to 6 months

  // Calculate plan details
  const calculatedPlan = useMemo((): PaymentPlan => {
    const downPayment = (treatmentTotal * downPaymentPercentage) / 100;
    const remainingAmount = treatmentTotal - downPayment;
    const interestAmount = (remainingAmount * interestRate) / 100;
    const totalWithInterest = treatmentTotal + interestAmount;
    const amountToFinance = remainingAmount + interestAmount;
    const installmentAmount = amountToFinance / numberOfInstallments;

    const startDate = new Date();
    const installments: Installment[] = [];

    for (let i = 1; i <= numberOfInstallments; i++) {
      let dueDate: Date;
      if (frequency === 'weekly') {
        dueDate = addWeeks(startDate, i);
      } else if (frequency === 'biweekly') {
        dueDate = addWeeks(startDate, i * 2);
      } else {
        dueDate = addMonths(startDate, i);
      }

      installments.push({
        number: i,
        dueDate,
        amount: installmentAmount,
        status: 'pending',
      });
    }

    return {
      id: `PP-${Date.now()}`,
      name: `Plan ${numberOfInstallments} pagos`,
      totalAmount: treatmentTotal,
      downPayment,
      downPaymentPercentage,
      numberOfInstallments,
      installmentAmount,
      frequency,
      interestRate,
      totalWithInterest,
      startDate,
      installments,
    };
  }, [treatmentTotal, downPaymentPercentage, numberOfInstallments, frequency, interestRate]);

  // Apply preset plan
  const applyPreset = (index: number) => {
    const preset = PRESET_PLANS[index];
    setSelectedPreset(index);
    setNumberOfInstallments(preset.installments);
    setInterestRate(preset.interestRate);
  };

  // Send plan to patient
  const sendPlanToPatient = async (method: 'email' | 'sms' | 'whatsapp') => {
    if (!patientEmail && method === 'email') {
      toast({ title: "Error", description: "No hay email del paciente", variant: "destructive" });
      return;
    }
    if (!patientPhone && (method === 'sms' || method === 'whatsapp')) {
      toast({ title: "Error", description: "No hay teléfono del paciente", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const planDetails = `
Plan de Pagos - NovellDent

Paciente: ${patientName}
Total del Tratamiento: $${treatmentTotal.toLocaleString()} MXN

📋 DETALLES DEL PLAN:
• Enganche (${downPaymentPercentage}%): $${calculatedPlan.downPayment.toLocaleString()}
• Número de pagos: ${numberOfInstallments}
• Monto por pago: $${calculatedPlan.installmentAmount.toLocaleString()}
• Frecuencia: ${FREQUENCY_OPTIONS.find(f => f.value === frequency)?.label}
${interestRate > 0 ? `• Interés: ${interestRate}%` : '• Sin intereses'}
• Total a pagar: $${calculatedPlan.totalWithInterest.toLocaleString()} MXN

📅 CALENDARIO DE PAGOS:
${calculatedPlan.installments.map(inst => 
  `Pago ${inst.number}: $${inst.amount.toLocaleString()} - ${format(inst.dueDate, "d 'de' MMMM, yyyy", { locale: es })}`
).join('\n')}

Este presupuesto es válido por 30 días.
Para confirmar su plan de pagos, contáctenos.

NovellDent - Clínica Dental
Tel: +52 322 183 7666
      `.trim();

      if (method === 'whatsapp') {
        const whatsappUrl = `https://wa.me/${patientPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(planDetails)}`;
        window.open(whatsappUrl, '_blank');
        toast({ title: "WhatsApp abierto", description: "Se abrió WhatsApp con el plan de pagos" });
      } else if (method === 'email') {
        const { error } = await supabase.functions.invoke('send-referral-promo', {
          body: {
            emails: [patientEmail],
            subject: `Plan de Pagos - NovellDent - ${patientName}`,
            message: planDetails.replace(/\n/g, '<br>'),
          }
        });
        if (error) throw error;
        toast({ title: "Email enviado", description: "El plan de pagos fue enviado al paciente" });
      } else if (method === 'sms') {
        // SMS would require additional integration
        toast({ title: "SMS no disponible", description: "La función de SMS requiere configuración adicional", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo enviar el plan", variant: "destructive" });
    } finally {
      setSending(false);
      setShowSendDialog(false);
    }
  };

  // Print plan
  const printPlan = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Plan de Pagos - ${patientName}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #1a5f7a; padding-bottom: 20px; }
          .header h1 { color: #1a5f7a; margin: 0; }
          .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .summary-box { background: #f5f5f5; padding: 15px; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #1a5f7a; color: white; }
          .total { font-size: 1.2em; font-weight: bold; color: #1a5f7a; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NovellDent - Plan de Pagos</h1>
          <p>Presupuesto de Financiamiento</p>
        </div>
        
        <div class="summary">
          <div class="summary-box">
            <h3>Información del Paciente</h3>
            <p><strong>Nombre:</strong> ${patientName}</p>
            <p><strong>Email:</strong> ${patientEmail}</p>
            <p><strong>Teléfono:</strong> ${patientPhone}</p>
          </div>
          <div class="summary-box">
            <h3>Resumen del Plan</h3>
            <p><strong>Total Tratamiento:</strong> $${treatmentTotal.toLocaleString()}</p>
            <p><strong>Enganche (${downPaymentPercentage}%):</strong> $${calculatedPlan.downPayment.toLocaleString()}</p>
            <p><strong>Interés:</strong> ${interestRate}%</p>
            <p class="total"><strong>Total a Pagar:</strong> $${calculatedPlan.totalWithInterest.toLocaleString()}</p>
          </div>
        </div>
        
        <h3>Calendario de Pagos (${numberOfInstallments} pagos ${FREQUENCY_OPTIONS.find(f => f.value === frequency)?.label.toLowerCase()}es)</h3>
        <table>
          <thead>
            <tr>
              <th>Pago #</th>
              <th>Fecha de Vencimiento</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #e8f5e9;">
              <td><strong>Enganche</strong></td>
              <td>${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</td>
              <td><strong>$${calculatedPlan.downPayment.toLocaleString()}</strong></td>
            </tr>
            ${calculatedPlan.installments.map(inst => `
              <tr>
                <td>${inst.number}</td>
                <td>${format(inst.dueDate, "d 'de' MMMM, yyyy", { locale: es })}</td>
                <td>$${inst.amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Este presupuesto es válido por 30 días a partir de la fecha de emisión.</p>
          <p>NovellDent - Puerto Vallarta, Jalisco | Tel: +52 322 183 7666 | www.novelldent.com</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tratamiento</p>
                <p className="text-2xl font-bold">${treatmentTotal.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enganche</p>
                <p className="text-2xl font-bold">${calculatedPlan.downPayment.toLocaleString()}</p>
              </div>
              <Wallet className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Pago</p>
                <p className="text-2xl font-bold">${calculatedPlan.installmentAmount.toLocaleString()}</p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Final</p>
                <p className="text-2xl font-bold">${calculatedPlan.totalWithInterest.toLocaleString()}</p>
              </div>
              <PiggyBank className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Calculadora de Pagos
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={printPlan}>
                  <Download className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button size="sm" onClick={() => setShowSendDialog(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar al Paciente
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset Plans */}
            <div>
              <Label className="mb-3 block">Planes Preestablecidos</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PRESET_PLANS.map((preset, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyPreset(index)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPreset === index 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{preset.installments} pagos</span>
                      {selectedPreset === index && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {preset.interestRate === 0 ? 'Sin intereses' : `${preset.interestRate}% interés`}
                    </p>
                    <p className="text-lg font-bold mt-2">
                      ${((treatmentTotal * (100 + preset.interestRate) / 100) / preset.installments).toLocaleString()}/mes
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Custom Configuration */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Enganche: {downPaymentPercentage}%</Label>
                  <Slider
                    value={[downPaymentPercentage]}
                    onValueChange={(v) => setDownPaymentPercentage(v[0])}
                    min={0}
                    max={50}
                    step={5}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>$0</span>
                    <span className="font-medium">${calculatedPlan.downPayment.toLocaleString()}</span>
                    <span>${(treatmentTotal * 0.5).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <Label>Número de Pagos: {numberOfInstallments}</Label>
                  <Slider
                    value={[numberOfInstallments]}
                    onValueChange={(v) => {
                      setNumberOfInstallments(v[0]);
                      setSelectedPreset(null);
                    }}
                    min={2}
                    max={24}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Frecuencia de Pagos</Label>
                  <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Tasa de Interés: {interestRate}%</Label>
                  <Slider
                    value={[interestRate]}
                    onValueChange={(v) => {
                      setInterestRate(v[0]);
                      setSelectedPreset(null);
                    }}
                    min={0}
                    max={20}
                    step={0.5}
                    className="mt-2"
                  />
                </div>

                <Card className="bg-secondary/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>${treatmentTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enganche:</span>
                      <span className="text-green-500">-${calculatedPlan.downPayment.toLocaleString()}</span>
                    </div>
                    {interestRate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Intereses:</span>
                        <span className="text-orange-500">+${((calculatedPlan.totalWithInterest - treatmentTotal)).toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${calculatedPlan.totalWithInterest.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {interestRate === 0 && (
                  <Badge variant="outline" className="w-full justify-center py-2 bg-green-500/10 text-green-600 border-green-500/30">
                    <Check className="w-4 h-4 mr-2" />
                    Sin intereses
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendario de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {/* Down Payment */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
              >
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 font-bold text-sm">
                  $
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Enganche</p>
                  <p className="text-xs text-muted-foreground">Al contratar</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${calculatedPlan.downPayment.toLocaleString()}</p>
                </div>
              </motion.div>

              {/* Installments */}
              {calculatedPlan.installments.map((installment, index) => (
                <motion.div
                  key={installment.number}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {installment.number}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Pago {installment.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(installment.dueDate, "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${installment.amount.toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Plan de Pagos al Paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              <Button
                variant="outline"
                className="h-16 justify-start gap-4"
                onClick={() => sendPlanToPatient('email')}
                disabled={sending || !patientEmail}
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Enviar por Email</p>
                  <p className="text-sm text-muted-foreground">{patientEmail || 'Sin email'}</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 justify-start gap-4"
                onClick={() => sendPlanToPatient('whatsapp')}
                disabled={sending || !patientPhone}
              >
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium">Enviar por WhatsApp</p>
                  <p className="text-sm text-muted-foreground">{patientPhone || 'Sin teléfono'}</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-16 justify-start gap-4"
                onClick={() => sendPlanToPatient('sms')}
                disabled={true}
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Enviar por SMS</p>
                  <p className="text-sm text-muted-foreground">Próximamente</p>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select Plan Button */}
      {onPlanSelected && (
        <div className="flex justify-end">
          <Button size="lg" onClick={() => onPlanSelected(calculatedPlan)} className="gap-2">
            <Check className="w-5 h-5" />
            Confirmar Plan de Pagos
          </Button>
        </div>
      )}
    </div>
  );
};
