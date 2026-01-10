-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to process scheduled emails every 5 minutes
SELECT cron.schedule(
  'process-scheduled-emails',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fpqzuowfzmqyiftumshk.supabase.co/functions/v1/process-scheduled-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcXp1b3dmem1xeWlmdHVtc2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODEzMzUsImV4cCI6MjA4MzU1NzMzNX0.oTulxj9MjY6QvQvCyx4AUghdHIyxUuPyQfnFlvsNrcs'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Insert default professional templates
INSERT INTO public.email_templates (name, description, blocks, global_styles, category, is_default) VALUES
(
  'Bienvenida Elegante',
  'Plantilla de bienvenida con diseño profesional y moderno',
  '[
    {"id":"logo-1","type":"logo","content":{"text":"NovellDent","emoji":"🦷"},"styles":{"alignment":"center","fontSize":28,"color":"#1e3a5f"}},
    {"id":"spacer-1","type":"spacer","content":{},"styles":{"height":24}},
    {"id":"heading-1","type":"heading","content":{"text":"¡Bienvenido a la familia NovellDent!"},"styles":{"fontSize":26,"fontWeight":"bold","color":"#1e3a5f","alignment":"center"}},
    {"id":"spacer-2","type":"spacer","content":{},"styles":{"height":16}},
    {"id":"text-1","type":"text","content":{"text":"Estamos encantados de que hayas decidido confiar en nosotros para cuidar de tu salud dental. Nuestro equipo de profesionales está comprometido con brindarte la mejor atención posible."},"styles":{"fontSize":15,"color":"#4b5563","alignment":"center","lineHeight":1.7}},
    {"id":"spacer-3","type":"spacer","content":{},"styles":{"height":24}},
    {"id":"button-1","type":"button","content":{"text":"Agendar mi primera cita","url":"#"},"styles":{"backgroundColor":"#3b82f6","color":"#ffffff","fontSize":15,"padding":16,"borderRadius":8,"alignment":"center"}},
    {"id":"spacer-4","type":"spacer","content":{},"styles":{"height":32}},
    {"id":"divider-1","type":"divider","content":{},"styles":{"color":"#e5e7eb","thickness":1,"width":60,"style":"solid"}},
    {"id":"spacer-5","type":"spacer","content":{},"styles":{"height":24}},
    {"id":"social-1","type":"social","content":{"facebook":"https://facebook.com","instagram":"https://instagram.com","twitter":"","linkedin":"","youtube":"","website":"https://novelldent.com"},"styles":{"alignment":"center","iconSize":24,"iconColor":"#3b82f6","spacing":16}},
    {"id":"footer-1","type":"footer","content":{"companyName":"NovellDent","address":"Av. Principal 123, Ciudad","phone":"+1 234 567 890","email":"info@novelldent.com","links":[{"text":"Términos","url":"#"},{"text":"Privacidad","url":"#"}],"unsubscribeText":"Si no deseas recibir más emails, puedes darte de baja aquí"},"styles":{"backgroundColor":"#1e3a5f","textColor":"#ffffff","fontSize":12,"padding":28}}
  ]'::jsonb,
  '{"backgroundColor":"#f8fafc","contentBackground":"#ffffff","fontFamily":"Arial, sans-serif","primaryColor":"#3b82f6","secondaryColor":"#1e3a5f","textColor":"#4b5563","width":600}'::jsonb,
  'welcome',
  true
),
(
  'Programa de Referidos',
  'Plantilla promocional para el programa de referidos con beneficios claros',
  '[
    {"id":"logo-1","type":"logo","content":{"text":"NovellDent","emoji":"🦷"},"styles":{"alignment":"center","fontSize":26,"color":"#1e3a5f"}},
    {"id":"spacer-1","type":"spacer","content":{},"styles":{"height":20}},
    {"id":"heading-1","type":"heading","content":{"text":"🎁 ¡Gana descuentos refiriendo amigos!"},"styles":{"fontSize":24,"fontWeight":"bold","color":"#1e3a5f","alignment":"center"}},
    {"id":"spacer-2","type":"spacer","content":{},"styles":{"height":16}},
    {"id":"text-1","type":"text","content":{"text":"Por cada amigo que nos refieras y complete su primera cita, ambos recibirán un 5% de descuento en su próximo tratamiento."},"styles":{"fontSize":15,"color":"#4b5563","alignment":"center","lineHeight":1.6}},
    {"id":"spacer-3","type":"spacer","content":{},"styles":{"height":24}},
    {"id":"list-1","type":"list","content":{"items":["Comparte tu código único con amigos","Tu amigo agenda su primera cita","Ambos reciben 5% de descuento","¡Sin límite de referidos!"]},"styles":{"fontSize":14,"color":"#374151","bulletColor":"#3b82f6"}},
    {"id":"spacer-4","type":"spacer","content":{},"styles":{"height":24}},
    {"id":"button-1","type":"button","content":{"text":"Obtener mi código de referido","url":"#"},"styles":{"backgroundColor":"#10b981","color":"#ffffff","fontSize":15,"padding":16,"borderRadius":8,"alignment":"center"}},
    {"id":"spacer-5","type":"spacer","content":{},"styles":{"height":16}},
    {"id":"text-2","type":"text","content":{"text":"¿Preguntas? Contáctanos en cualquier momento."},"styles":{"fontSize":13,"color":"#6b7280","alignment":"center","lineHeight":1.5}},
    {"id":"footer-1","type":"footer","content":{"companyName":"NovellDent","address":"Av. Principal 123, Ciudad","phone":"+1 234 567 890","email":"info@novelldent.com","links":[{"text":"Términos","url":"#"},{"text":"Privacidad","url":"#"}],"unsubscribeText":"Si no deseas recibir más emails, puedes darte de baja aquí"},"styles":{"backgroundColor":"#1e3a5f","textColor":"#ffffff","fontSize":12,"padding":24}}
  ]'::jsonb,
  '{"backgroundColor":"#f0fdf4","contentBackground":"#ffffff","fontFamily":"Arial, sans-serif","primaryColor":"#10b981","secondaryColor":"#1e3a5f","textColor":"#374151","width":600}'::jsonb,
  'referral',
  true
),
(
  'Recordatorio de Cita',
  'Plantilla para recordar a los pacientes sobre sus próximas citas',
  '[
    {"id":"logo-1","type":"logo","content":{"text":"NovellDent","emoji":"🦷"},"styles":{"alignment":"center","fontSize":26,"color":"#1e3a5f"}},
    {"id":"spacer-1","type":"spacer","content":{},"styles":{"height":20}},
    {"id":"heading-1","type":"heading","content":{"text":"📅 Recordatorio de tu cita"},"styles":{"fontSize":24,"fontWeight":"bold","color":"#1e3a5f","alignment":"center"}},
    {"id":"spacer-2","type":"spacer","content":{},"styles":{"height":16}},
    {"id":"text-1","type":"text","content":{"text":"Te recordamos que tienes una cita programada con nosotros. Por favor, llega 10 minutos antes para completar cualquier documentación necesaria."},"styles":{"fontSize":15,"color":"#4b5563","alignment":"center","lineHeight":1.6}},
    {"id":"spacer-3","type":"spacer","content":{},"styles":{"height":24}},
    {"id":"columns-1","type":"columns","content":{"left":"📍 Ubicación:\nAv. Principal 123\nCiudad, CP 12345","right":"🕐 Fecha y hora:\n[Fecha de la cita]\n[Hora de la cita]"},"styles":{"gap":24,"fontSize":14,"color":"#374151"}},
    {"id":"spacer-4","type":"spacer","content":{},"styles":{"height":24}},
    {"id":"button-1","type":"button","content":{"text":"Confirmar asistencia","url":"#"},"styles":{"backgroundColor":"#3b82f6","color":"#ffffff","fontSize":15,"padding":14,"borderRadius":8,"alignment":"center"}},
    {"id":"spacer-5","type":"spacer","content":{},"styles":{"height":8}},
    {"id":"text-2","type":"text","content":{"text":"¿Necesitas reagendar? Llámanos al +1 234 567 890"},"styles":{"fontSize":13,"color":"#6b7280","alignment":"center","lineHeight":1.5}},
    {"id":"footer-1","type":"footer","content":{"companyName":"NovellDent","address":"Av. Principal 123, Ciudad","phone":"+1 234 567 890","email":"info@novelldent.com","links":[{"text":"Reagendar","url":"#"},{"text":"Contacto","url":"#"}],"unsubscribeText":"Si no deseas recibir recordatorios, puedes configurarlo en tu perfil"},"styles":{"backgroundColor":"#1e3a5f","textColor":"#ffffff","fontSize":12,"padding":24}}
  ]'::jsonb,
  '{"backgroundColor":"#eff6ff","contentBackground":"#ffffff","fontFamily":"Arial, sans-serif","primaryColor":"#3b82f6","secondaryColor":"#1e3a5f","textColor":"#374151","width":600}'::jsonb,
  'reminder',
  true
),
(
  'Promoción Especial',
  'Plantilla para promociones y ofertas especiales con llamado a la acción fuerte',
  '[
    {"id":"logo-1","type":"logo","content":{"text":"NovellDent","emoji":"🦷"},"styles":{"alignment":"center","fontSize":26,"color":"#1e3a5f"}},
    {"id":"spacer-1","type":"spacer","content":{},"styles":{"height":16}},
    {"id":"heading-1","type":"heading","content":{"text":"🔥 ¡Oferta por tiempo limitado!"},"styles":{"fontSize":28,"fontWeight":"bold","color":"#dc2626","alignment":"center"}},
    {"id":"spacer-2","type":"spacer","content":{},"styles":{"height":12}},
    {"id":"heading-2","type":"heading","content":{"text":"20% DE DESCUENTO"},"styles":{"fontSize":36,"fontWeight":"bold","color":"#1e3a5f","alignment":"center"}},
    {"id":"text-1","type":"text","content":{"text":"en limpieza dental profesional"},"styles":{"fontSize":16,"color":"#6b7280","alignment":"center","lineHeight":1.5}},
    {"id":"spacer-3","type":"spacer","content":{},"styles":{"height":20}},
    {"id":"divider-1","type":"divider","content":{},"styles":{"color":"#fecaca","thickness":2,"width":40,"style":"solid"}},
    {"id":"spacer-4","type":"spacer","content":{},"styles":{"height":20}},
    {"id":"text-2","type":"text","content":{"text":"Aprovecha esta oferta exclusiva válida solo hasta fin de mes. Mantén tu sonrisa radiante con nuestro tratamiento de limpieza profesional."},"styles":{"fontSize":15,"color":"#4b5563","alignment":"center","lineHeight":1.6}},
    {"id":"spacer-5","type":"spacer","content":{},"styles":{"height":24}},
    {"id":"button-1","type":"button","content":{"text":"¡Quiero mi descuento!","url":"#"},"styles":{"backgroundColor":"#dc2626","color":"#ffffff","fontSize":16,"padding":18,"borderRadius":8,"alignment":"center"}},
    {"id":"spacer-6","type":"spacer","content":{},"styles":{"height":16}},
    {"id":"text-3","type":"text","content":{"text":"⏰ Oferta válida hasta el 31 de este mes"},"styles":{"fontSize":13,"color":"#dc2626","alignment":"center","lineHeight":1.5}},
    {"id":"footer-1","type":"footer","content":{"companyName":"NovellDent","address":"Av. Principal 123, Ciudad","phone":"+1 234 567 890","email":"info@novelldent.com","links":[{"text":"Ver más ofertas","url":"#"},{"text":"Contacto","url":"#"}],"unsubscribeText":"Si no deseas recibir promociones, puedes darte de baja aquí"},"styles":{"backgroundColor":"#1e3a5f","textColor":"#ffffff","fontSize":12,"padding":24}}
  ]'::jsonb,
  '{"backgroundColor":"#fef2f2","contentBackground":"#ffffff","fontFamily":"Arial, sans-serif","primaryColor":"#dc2626","secondaryColor":"#1e3a5f","textColor":"#374151","width":600}'::jsonb,
  'promotion',
  true
),
(
  'Feliz Cumpleaños',
  'Plantilla para felicitar a los pacientes en su cumpleaños con un regalo especial',
  '[
    {"id":"logo-1","type":"logo","content":{"text":"NovellDent","emoji":"🦷"},"styles":{"alignment":"center","fontSize":26,"color":"#1e3a5f"}},
    {"id":"spacer-1","type":"spacer","content":{},"styles":{"height":16}},
    {"id":"heading-1","type":"heading","content":{"text":"🎂 ¡Feliz Cumpleaños!"},"styles":{"fontSize":32,"fontWeight":"bold","color":"#7c3aed","alignment":"center"}},
    {"id":"spacer-2","type":"spacer","content":{},"styles":{"height":16}},
    {"id":"text-1","type":"text","content":{"text":"En tu día especial, queremos celebrar contigo regalándote algo muy especial para tu sonrisa."},"styles":{"fontSize":16,"color":"#4b5563","alignment":"center","lineHeight":1.6}},
    {"id":"spacer-3","type":"spacer","content":{},"styles":{"height":24}},
    {"id":"heading-2","type":"heading","content":{"text":"🎁 15% DE DESCUENTO"},"styles":{"fontSize":28,"fontWeight":"bold","color":"#7c3aed","alignment":"center"}},
    {"id":"text-2","type":"text","content":{"text":"en cualquier tratamiento dental"},"styles":{"fontSize":15,"color":"#6b7280","alignment":"center","lineHeight":1.5}},
    {"id":"spacer-4","type":"spacer","content":{},"styles":{"height":24}},
    {"id":"button-1","type":"button","content":{"text":"Usar mi regalo de cumpleaños","url":"#"},"styles":{"backgroundColor":"#7c3aed","color":"#ffffff","fontSize":15,"padding":16,"borderRadius":24,"alignment":"center"}},
    {"id":"spacer-5","type":"spacer","content":{},"styles":{"height":16}},
    {"id":"text-3","type":"text","content":{"text":"Válido durante todo el mes de tu cumpleaños 🎈"},"styles":{"fontSize":13,"color":"#7c3aed","alignment":"center","lineHeight":1.5}},
    {"id":"spacer-6","type":"spacer","content":{},"styles":{"height":24}},
    {"id":"social-1","type":"social","content":{"facebook":"https://facebook.com","instagram":"https://instagram.com","twitter":"","linkedin":"","youtube":"","website":""},"styles":{"alignment":"center","iconSize":22,"iconColor":"#7c3aed","spacing":14}},
    {"id":"footer-1","type":"footer","content":{"companyName":"NovellDent","address":"Av. Principal 123, Ciudad","phone":"+1 234 567 890","email":"info@novelldent.com","links":[{"text":"Agendar cita","url":"#"}],"unsubscribeText":"Si no deseas recibir estos mensajes, puedes darte de baja aquí"},"styles":{"backgroundColor":"#7c3aed","textColor":"#ffffff","fontSize":12,"padding":24}}
  ]'::jsonb,
  '{"backgroundColor":"#f5f3ff","contentBackground":"#ffffff","fontFamily":"Arial, sans-serif","primaryColor":"#7c3aed","secondaryColor":"#1e3a5f","textColor":"#374151","width":600}'::jsonb,
  'celebration',
  true
),
(
  'Solicitud de Reseña',
  'Plantilla para pedir a los pacientes que dejen una reseña después de su visita',
  '[
    {"id":"logo-1","type":"logo","content":{"text":"NovellDent","emoji":"🦷"},"styles":{"alignment":"center","fontSize":26,"color":"#1e3a5f"}},
    {"id":"spacer-1","type":"spacer","content":{},"styles":{"height":20}},
    {"id":"heading-1","type":"heading","content":{"text":"¿Cómo fue tu experiencia?"},"styles":{"fontSize":26,"fontWeight":"bold","color":"#1e3a5f","alignment":"center"}},
    {"id":"spacer-2","type":"spacer","content":{},"styles":{"height":16}},
    {"id":"text-1","type":"text","content":{"text":"Esperamos que tu visita a NovellDent haya sido excelente. Tu opinión es muy importante para nosotros y nos ayuda a seguir mejorando."},"styles":{"fontSize":15,"color":"#4b5563","alignment":"center","lineHeight":1.6}},
    {"id":"spacer-3","type":"spacer","content":{},"styles":{"height":20}},
    {"id":"heading-2","type":"heading","content":{"text":"⭐⭐⭐⭐⭐"},"styles":{"fontSize":32,"fontWeight":"bold","color":"#f59e0b","alignment":"center"}},
    {"id":"spacer-4","type":"spacer","content":{},"styles":{"height":20}},
    {"id":"text-2","type":"text","content":{"text":"¿Podrías tomarte un minuto para dejarnos tu reseña? Solo toma 30 segundos y significa mucho para nuestro equipo."},"styles":{"fontSize":14,"color":"#6b7280","alignment":"center","lineHeight":1.6}},
    {"id":"spacer-5","type":"spacer","content":{},"styles":{"height":24}},
    {"id":"button-1","type":"button","content":{"text":"Dejar mi reseña","url":"#"},"styles":{"backgroundColor":"#f59e0b","color":"#ffffff","fontSize":15,"padding":16,"borderRadius":8,"alignment":"center"}},
    {"id":"spacer-6","type":"spacer","content":{},"styles":{"height":16}},
    {"id":"text-3","type":"text","content":{"text":"¡Gracias por confiar en nosotros!"},"styles":{"fontSize":14,"color":"#4b5563","alignment":"center","lineHeight":1.5}},
    {"id":"footer-1","type":"footer","content":{"companyName":"NovellDent","address":"Av. Principal 123, Ciudad","phone":"+1 234 567 890","email":"info@novelldent.com","links":[{"text":"Contacto","url":"#"}],"unsubscribeText":"Si no deseas recibir estos mensajes, puedes darte de baja aquí"},"styles":{"backgroundColor":"#1e3a5f","textColor":"#ffffff","fontSize":12,"padding":24}}
  ]'::jsonb,
  '{"backgroundColor":"#fffbeb","contentBackground":"#ffffff","fontFamily":"Arial, sans-serif","primaryColor":"#f59e0b","secondaryColor":"#1e3a5f","textColor":"#374151","width":600}'::jsonb,
  'review',
  true
);