import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Download, Share2, Copy, Printer, Check, User, Mail, Phone, Calendar } from "lucide-react";

interface PatientQRCodeProps {
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  patientDOB?: string;
}

export const PatientQRCode = ({
  patientId,
  patientName,
  patientEmail,
  patientPhone,
  patientDOB
}: PatientQRCodeProps) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate QR data - can be a URL or vCard data
  const baseUrl = window.location.origin;
  const patientUrl = `${baseUrl}/portal?patient=${patientId}`;
  
  // Generate vCard format for more data
  const vCardData = `BEGIN:VCARD
VERSION:3.0
N:${patientName}
FN:${patientName}
${patientEmail ? `EMAIL:${patientEmail}` : ''}
${patientPhone ? `TEL:${patientPhone}` : ''}
${patientDOB ? `BDAY:${patientDOB}` : ''}
NOTE:ID:${patientId}
URL:${patientUrl}
END:VCARD`;

  const downloadQR = () => {
    const svg = document.getElementById('patient-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const link = document.createElement('a');
      link.download = `qr-${patientName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    
    toast({
      title: "QR Descargado",
      description: "El código QR ha sido descargado"
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(patientUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Enlace copiado",
        description: "El enlace ha sido copiado al portapapeles"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive"
      });
    }
  };

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${patientName}`,
          text: `Accede al perfil del paciente ${patientName}`,
          url: patientUrl
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      copyLink();
    }
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svg = document.getElementById('patient-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${patientName}</title>
        <style>
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .qr-container {
            text-align: center;
            padding: 40px;
            border: 2px solid #e5e7eb;
            border-radius: 16px;
          }
          h1 { margin-bottom: 8px; font-size: 24px; }
          p { color: #6b7280; margin: 4px 0; font-size: 14px; }
          .id { font-family: monospace; font-size: 12px; color: #9ca3af; margin-top: 16px; }
          svg { margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <h1>${patientName}</h1>
          ${patientEmail ? `<p>${patientEmail}</p>` : ''}
          ${patientPhone ? `<p>${patientPhone}</p>` : ''}
          ${svgData}
          <p class="id">ID: ${patientId}</p>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      {/* QR Button Trigger */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="gap-2"
      >
        <QrCode className="w-4 h-4" />
        Ver QR
      </Button>

      {/* QR Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Código QR del Paciente
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            {/* Patient Info */}
            <div className="text-center">
              <h3 className="font-semibold text-lg">{patientName}</h3>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {patientEmail && (
                  <Badge variant="secondary" className="gap-1">
                    <Mail className="w-3 h-3" />
                    {patientEmail}
                  </Badge>
                )}
                {patientPhone && (
                  <Badge variant="secondary" className="gap-1">
                    <Phone className="w-3 h-3" />
                    {patientPhone}
                  </Badge>
                )}
              </div>
            </div>

            {/* QR Code */}
            <div className="p-6 bg-white rounded-2xl shadow-lg">
              <QRCodeSVG
                id="patient-qr-code"
                value={patientUrl}
                size={200}
                level="H"
                includeMargin
                imageSettings={{
                  src: "/favicon.ico",
                  height: 24,
                  width: 24,
                  excavate: true
                }}
              />
            </div>

            {/* Patient ID */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">ID del Paciente</p>
              <code className="text-sm bg-secondary px-3 py-1 rounded-md">{patientId.slice(0, 8)}...</code>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={copyLink} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar Enlace'}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadQR} className="gap-2">
                <Download className="w-4 h-4" />
                Descargar
              </Button>
              <Button variant="outline" size="sm" onClick={printQR} className="gap-2">
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={shareQR} className="gap-2">
                <Share2 className="w-4 h-4" />
                Compartir
              </Button>
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground text-center">
              Escanea este código para acceder al perfil del paciente
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
