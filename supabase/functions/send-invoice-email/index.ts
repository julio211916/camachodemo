import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceEmailRequest {
  invoiceId: string;
  patientEmail: string;
  patientName: string;
  invoiceNumber: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  dueDate?: string;
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      invoiceId, 
      patientEmail, 
      patientName, 
      invoiceNumber, 
      total,
      subtotal,
      taxAmount,
      discountAmount,
      dueDate, 
      items 
    }: InvoiceEmailRequest = await req.json();

    if (!patientEmail) {
      throw new Error("Email del paciente es requerido");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no configurada");
    }

    // Generate items HTML
    const itemsHtml = items && items.length > 0 
      ? items.map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.total.toFixed(2)}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #6b7280;">Servicios dentales</td></tr>';

    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🦷 NovellDent</h1>
          <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 14px;">Clínica Dental</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Factura ${invoiceNumber}</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
            Estimado/a <strong>${patientName}</strong>,
          </p>
          
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
            Adjunto encontrará los detalles de su factura por los servicios dentales recibidos en NovellDent.
          </p>
          
          <!-- Invoice Details -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Número de Factura:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${invoiceNumber}</td>
              </tr>
              ${dueDate ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Fecha de Vencimiento:</td>
                <td style="padding: 8px 0; color: #1f2937; font-weight: 600; text-align: right;">${dueDate}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Descripción</th>
                <th style="padding: 12px; text-align: center; color: #374151; font-weight: 600;">Cant.</th>
                <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600;">P. Unit.</th>
                <th style="padding: 12px; text-align: right; color: #374151; font-weight: 600;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <!-- Totals -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Subtotal:</td>
                <td style="padding: 6px 0; text-align: right;">$${subtotal?.toFixed(2) || '0.00'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">IVA:</td>
                <td style="padding: 6px 0; text-align: right;">$${taxAmount?.toFixed(2) || '0.00'}</td>
              </tr>
              ${discountAmount > 0 ? `
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Descuento:</td>
                <td style="padding: 6px 0; text-align: right; color: #10b981;">-$${discountAmount.toFixed(2)}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <!-- Total -->
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 8px; padding: 20px; text-align: right;">
            <span style="color: #e0f2fe; font-size: 14px;">Total a Pagar</span>
            <p style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 5px 0 0 0;">$${total.toFixed(2)} MXN</p>
          </div>
          
          <!-- Payment Info -->
          <div style="margin-top: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">💳 Formas de Pago</h3>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Efectivo en clínica</li>
              <li>Tarjeta de crédito/débito</li>
              <li>Transferencia bancaria</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
            Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.<br>
            📞 +52 322 183 7666 | 📧 info@novelldent.com
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} NovellDent. Todos los derechos reservados.
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
            Puerto Vallarta, Jalisco, México
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send email using Resend API directly
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "NovellDent <onboarding@resend.dev>",
        to: [patientEmail],
        subject: `Factura ${invoiceNumber} - NovellDent`,
        html: emailHtml,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Error al enviar email");
    }

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invoice email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
