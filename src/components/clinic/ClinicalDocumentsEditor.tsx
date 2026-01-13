import { useState, useCallback } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table as UITable, TableBody, TableCell as UITableCell, TableHead, TableHeader as UITableHeader, TableRow as UITableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered,
  Quote, Undo, Redo, Link as LinkIcon, Image as ImageIcon, AlignLeft, AlignCenter,
  AlignRight, Heading1, Heading2, Heading3, Code, Minus, Plus, Edit2, Trash2,
  MoreHorizontal, Copy, Printer, XCircle, Eye, Save, X, FileText, Table2,
  Columns, Type, SeparatorHorizontal, Download, Upload, CheckSquare, Square,
  Rows, GripVertical
} from "lucide-react";
import { motion } from "framer-motion";

// Clinical Document Interface
interface ClinicalDocument {
  id: string;
  nombre: string;
  categoria: string;
  estado: 'Habilitada' | 'Deshabilitada';
  contenido: string;
  fechaCreacion: Date;
  fechaModificacion: Date;
}

// Full 20 Clinical Documents with complete content
const CLINICAL_DOCUMENTS: ClinicalDocument[] = [
  {
    id: '1',
    nombre: 'Ficha General Dental',
    categoria: 'Diagnóstico',
    estado: 'Habilitada',
    contenido: `<h1>FICHA GENERAL DENTAL</h1>
<h2>Datos del Paciente</h2>
<p><strong>Nombre:</strong> ______________________ <strong>Fecha:</strong> ______________</p>

<h3>Motivo de Consulta</h3>
<p>☐ Urgencia &nbsp; ☐ Examen &nbsp; ☐ Interconsulta &nbsp; ☐ Diagnóstico &nbsp; ☐ Otro</p>
<p><strong>Observaciones:</strong> _________________________________________________</p>

<h3>Antecedentes Clínicos Generales</h3>
<p>____________________________________________________________________</p>

<h3>Examen Extraoral</h3>
<table style="width:100%; border-collapse: collapse;">
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Mucosas:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Vestíbulo:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Encías:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Paladar:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Lengua:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Oclusión:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
</table>

<h3>Examen Intraoral</h3>
<p><strong>Piezas ausentes:</strong> ________________________________________________</p>
<p><strong>Piezas con caries:</strong> _______________________________________________</p>
<p><strong>Piezas con movilidad:</strong> ____________________________________________</p>
<p><strong>Prótesis fija:</strong> ☐ Sí ☐ No &nbsp;&nbsp; <strong>Prótesis removible:</strong> ☐ Sí ☐ No</p>

<h3>Examen Complementario</h3>
<p>____________________________________________________________________</p>

<h3>Diagnóstico Inicial</h3>
<p>____________________________________________________________________</p>

<h3>Pronóstico General</h3>
<p>☐ Bueno &nbsp; ☐ Reservado &nbsp; ☐ Malo</p>`,
    fechaCreacion: new Date('2024-01-01'),
    fechaModificacion: new Date('2024-06-15')
  },
  {
    id: '2',
    nombre: 'Expediente Clínico NOM-004-SSA3-2012',
    categoria: 'Legal',
    estado: 'Habilitada',
    contenido: `<h1>EXPEDIENTE CLÍNICO</h1>
<h2>CONFORME A LA NORMA NOM-004-SSA3-2012</h2>

<table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>No. de Expediente:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;"><strong>Fecha Inicio:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Fecha de Alta:</strong></td><td style="border:1px solid #ccc; padding:8px;" colspan="3"></td></tr>
</table>

<h3>Datos Demográficos</h3>
<p><strong>Sexo:</strong> ☐ Masculino ☐ Femenino &nbsp;&nbsp; <strong>Fecha Nacimiento:</strong> ______________</p>
<p><strong>Ocupación:</strong> __________________ <strong>Escolaridad:</strong> __________________</p>
<p><strong>Estado Civil:</strong> ☐ Soltero(a) ☐ Casado(a) ☐ Unión Libre ☐ Divorciado(a) ☐ Viudo(a)</p>

<h3>Datos de Contacto</h3>
<p><strong>Domicilio:</strong> _________________________________________________________</p>
<p><strong>Teléfono:</strong> __________________ <strong>Celular:</strong> __________________</p>
<p><strong>Institución que lo envía:</strong> ____________________________________________</p>

<h3>Antecedentes Familiares</h3>
<p>☐ Diabetes ☐ Hipertensión ☐ Cardiopatías ☐ Neoplasias ☐ Epilepsia</p>
<p>☐ Malformaciones ☐ SIDA ☐ Enfermedades renales ☐ Hepatitis ☐ Artritis</p>
<p>☐ Otros: _____________________________________________________________</p>

<h3>Antecedentes Personales Patológicos</h3>
<p>☐ Varicela ☐ Rubéola ☐ Sarampión ☐ Parotiditis ☐ Tosferina ☐ Escarlatina</p>
<p>☐ Parasitosis ☐ Hepatitis ☐ SIDA ☐ Asma ☐ Diabetes ☐ Hipertensión</p>
<p>☐ Cardiopatías ☐ Epilepsia ☐ Artritis ☐ Anemia ☐ Hemofilia</p>
<p>☐ Otros: _____________________________________________________________</p>

<h3>Antecedentes No Patológicos</h3>
<p><strong>Higiene bucal:</strong> ☐ Buena ☐ Regular ☐ Mala</p>
<p><strong>Cepillado:</strong> ___ veces al día</p>
<p><strong>Uso de fluoruros:</strong> ☐ Sí ☐ No</p>

<h3>Diagnósticos</h3>
<ol>
<li>__________________________________________________________________</li>
<li>__________________________________________________________________</li>
<li>__________________________________________________________________</li>
</ol>

<h3>Consentimiento Informado</h3>
<p>Declaro que he sido informado(a) sobre mi estado de salud y los tratamientos propuestos.</p>
<p><strong>Firma del Paciente:</strong> _____________________ <strong>Fecha:</strong> ______________</p>
<p><strong>Firma del Profesional:</strong> _____________________ <strong>Cédula:</strong> ______________</p>`,
    fechaCreacion: new Date('2024-01-01'),
    fechaModificacion: new Date('2024-08-20')
  },
  {
    id: '3',
    nombre: 'Historia Clínica - Breve Cuestionario de Salud',
    categoria: 'Diagnóstico',
    estado: 'Habilitada',
    contenido: `<h1>HISTORIA CLÍNICA</h1>
<h2>BREVE CUESTIONARIO DE SALUD</h2>

<p><strong>Nombre del Paciente:</strong> ________________________________ <strong>Fecha:</strong> ______________</p>

<h3>Hospitalización en Últimos Años</h3>
<p>¿Ha sido hospitalizado en los últimos 5 años? ☐ Sí ☐ No</p>
<p>Motivo: __________________________________________________________________</p>

<h3>Vacunas</h3>
<p>¿Tiene sus vacunas al día? ☐ Sí ☐ No ☐ No me acuerdo</p>

<h3>Enfermedades Previas</h3>
<table style="width:100%; border-collapse: collapse;">
<tr>
<td style="padding:5px;">☐ Hepatitis</td><td style="padding:5px;">☐ Hipotensión</td><td style="padding:5px;">☐ Hipertensión</td><td style="padding:5px;">☐ Hemofilia</td>
</tr>
<tr>
<td style="padding:5px;">☐ Cardiopatías</td><td style="padding:5px;">☐ Anemia</td><td style="padding:5px;">☐ ETS</td><td style="padding:5px;">☐ Cáncer</td>
</tr>
<tr>
<td style="padding:5px;">☐ Diabetes</td><td style="padding:5px;">☐ Epilepsia</td><td style="padding:5px;">☐ Artritis</td><td style="padding:5px;">☐ Fiebre Reumática</td>
</tr>
</table>

<h3>Medicamentos Actuales</h3>
<p>____________________________________________________________________</p>

<h3>APARATOS Y SISTEMAS</h3>
<table style="width:100%; border-collapse: collapse;">
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Digestivo:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Respiratorio:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Cardio-Vascular:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Sistema Nervioso:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Sistema Endocrino:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Hemático-Linfático:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Genito-Urinario:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
</table>

<h3>Antecedentes Hereditarios</h3>
<p>¿Familiares con infarto? ☐ Sí ☐ No &nbsp;&nbsp; ¿Cáncer? ☐ Sí ☐ No</p>
<p>¿Hiper/Hipotensión? ☐ Sí ☐ No &nbsp;&nbsp; ¿Diabetes? ☐ Sí ☐ No</p>

<h3>Embarazo (Solo mujeres)</h3>
<p>¿Está embarazada? ☐ Sí ☐ No ☐ Lo sospecho</p>

<h3>SIGNOS VITALES</h3>
<table style="width:100%; border-collapse: collapse;">
<tr>
<td style="border:1px solid #ccc; padding:8px;"><strong>Tensión Arterial:</strong> ___/___</td>
<td style="border:1px solid #ccc; padding:8px;"><strong>Pulso:</strong> ___ bpm</td>
</tr>
<tr>
<td style="border:1px solid #ccc; padding:8px;"><strong>Frecuencia Respiratoria:</strong> ___</td>
<td style="border:1px solid #ccc; padding:8px;"><strong>Peso:</strong> ___ kg / <strong>Estatura:</strong> ___ cm</td>
</tr>
</table>

<h3>Antecedentes Odontológicos</h3>
<p><strong>Higiene bucal:</strong> ☐ Buena ☐ Regular ☐ Mala</p>
<p><strong>Frecuencia cepillado:</strong> ___ veces/día</p>
<p><strong>Uso de hilo dental:</strong> ☐ Sí ☐ No &nbsp;&nbsp; <strong>Enjuague bucal:</strong> ☐ Sí ☐ No</p>
<p><strong>Experiencia dental previa:</strong> ☐ Buena ☐ Regular ☐ Mala</p>
<p><strong>Sangrado de encías:</strong> ☐ Sí ☐ No &nbsp;&nbsp; <strong>Sensibilidad:</strong> ☐ Sí ☐ No</p>

<h3>PARAFUNCIONES</h3>
<p>☐ Masticación chicle ☐ Malposición lengua ☐ Apretamiento diurno</p>
<p>☐ Apretamiento nocturno ☐ Rechinamiento ☐ Onicofagia (morderse uñas)</p>
<p>☐ Succión digital ☐ Interposición labial ☐ Respiración oral</p>`,
    fechaCreacion: new Date('2024-01-15'),
    fechaModificacion: new Date('2024-09-10')
  },
  {
    id: '4',
    nombre: 'Aviso de Privacidad',
    categoria: 'Legal',
    estado: 'Habilitada',
    contenido: `<h1>AVISO DE PRIVACIDAD</h1>
<h2>PROTECCIÓN DE DATOS PERSONALES</h2>

<p><strong>NovellDent Clínica Dental</strong>, con domicilio en Puerto Vallarta, Jalisco, México, es responsable del tratamiento de sus datos personales.</p>

<h3>Datos Personales que Recabamos</h3>
<p>Para cumplir con los servicios de salud dental contratados, recabamos los siguientes datos personales:</p>
<ul>
<li>Datos de identificación: nombre, dirección, teléfono, correo electrónico</li>
<li>Datos de salud: historial médico y dental, radiografías, fotografías clínicas</li>
<li>Datos financieros: para efectos de facturación</li>
</ul>

<h3>Finalidades del Tratamiento</h3>
<p>Sus datos personales serán utilizados para:</p>
<ol>
<li>Prestación de servicios dentales</li>
<li>Elaboración de expediente clínico</li>
<li>Comunicación sobre citas y tratamientos</li>
<li>Facturación y cobranza</li>
<li>Cumplimiento de obligaciones legales</li>
</ol>

<h3>Transferencia de Datos</h3>
<p>Sus datos no serán transferidos a terceros sin su consentimiento, excepto cuando sea requerido por autoridades competentes.</p>

<h3>Derechos ARCO</h3>
<p>Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales. Para ejercer estos derechos, contacte a: <strong>privacidad@novelldent.com</strong></p>

<h3>Uso de Cookies</h3>
<p>Nuestro sitio web utiliza cookies para mejorar su experiencia. Puede deshabilitarlas en la configuración de su navegador.</p>

<h3>Cambios al Aviso de Privacidad</h3>
<p>Nos reservamos el derecho de modificar este aviso. Las modificaciones estarán disponibles en nuestras instalaciones y sitio web.</p>

<hr>
<p><strong>Última actualización:</strong> Enero 2026</p>

<h3>Consentimiento</h3>
<p>He leído y acepto el presente Aviso de Privacidad.</p>
<p><strong>Nombre:</strong> ________________________________</p>
<p><strong>Firma:</strong> ________________________________ <strong>Fecha:</strong> ______________</p>`,
    fechaCreacion: new Date('2024-01-01'),
    fechaModificacion: new Date('2024-01-01')
  },
  {
    id: '5',
    nombre: 'Informed Consent - Consentimiento General',
    categoria: 'Consentimiento',
    estado: 'Habilitada',
    contenido: `<h1>INFORMED CONSENT</h1>
<h2>CONSENTIMIENTO INFORMADO GENERAL</h2>

<p><strong>Nombre del Paciente:</strong> ________________________________</p>
<p><strong>Fecha:</strong> ______________</p>

<h3>Autorización para Procedimientos Dentales</h3>
<p>Yo, el/la paciente abajo firmante, por medio del presente documento:</p>

<ol>
<li><strong>AUTORIZO</strong> al Dr./Dra. _________________________ y a su equipo de trabajo a realizar los procedimientos dentales necesarios para mi tratamiento.</li>

<li><strong>DECLARO</strong> que he sido informado(a) de manera clara y comprensible sobre:
<ul>
<li>Mi diagnóstico dental actual</li>
<li>Los tratamientos recomendados y sus alternativas</li>
<li>Los riesgos y beneficios de cada procedimiento</li>
<li>Los costos estimados del tratamiento</li>
</ul>
</li>

<li><strong>COMPRENDO</strong> que los procedimientos dentales pueden implicar riesgos como:
<ul>
<li>Dolor o molestias postoperatorias</li>
<li>Sangrado</li>
<li>Infección</li>
<li>Reacciones alérgicas a la anestesia o medicamentos</li>
<li>Daño a nervios o estructuras adyacentes</li>
<li>Necesidad de tratamientos adicionales</li>
</ul>
</li>

<li><strong>CONFIRMO</strong> que he proporcionado información veraz sobre mi historial médico, alergias y medicamentos actuales.</li>

<li><strong>ACEPTO</strong> seguir las instrucciones pre y postoperatorias indicadas por el profesional.</li>
</ol>

<h3>Consentimiento para Anestesia</h3>
<p>☐ Autorizo el uso de anestesia local</p>
<p>☐ Autorizo el uso de sedación consciente (si aplica)</p>

<h3>Uso de Imágenes</h3>
<p>☐ Autorizo el uso de fotografías/radiografías con fines educativos (sin identificación)</p>
<p>☐ NO autorizo el uso de mis imágenes</p>

<hr>
<p><strong>Firma del Paciente:</strong> ________________________________</p>
<p><strong>Nombre del Representante (si aplica):</strong> ________________________________</p>
<p><strong>Relación:</strong> __________________ <strong>Firma:</strong> ________________________________</p>

<hr>
<p><strong>Firma del Profesional:</strong> ________________________________</p>
<p><strong>Nombre:</strong> ________________________________ <strong>Cédula:</strong> ______________</p>`,
    fechaCreacion: new Date('2024-02-01'),
    fechaModificacion: new Date('2024-07-15')
  },
  {
    id: '6',
    nombre: 'Cuidados Post-Operatorios Extracción',
    categoria: 'Postoperatorio',
    estado: 'Habilitada',
    contenido: `<h1>CUIDADOS POST-OPERATORIOS</h1>
<h2>EXTRACCIÓN DENTAL</h2>

<p><strong>Paciente:</strong> ________________________________ <strong>Fecha:</strong> ______________</p>
<p><strong>Pieza(s) extraída(s):</strong> ________________________________</p>

<h3>Instrucciones Importantes</h3>

<h4>🩹 GASA</h4>
<ul>
<li>Mantenga la gasa en posición mordiendo firmemente durante <strong>1 hora</strong></li>
<li>Si continúa el sangrado, coloque una nueva gasa húmeda y muerda por 30 minutos más</li>
<li>Es normal un ligero sangrado durante las primeras 24 horas</li>
</ul>

<h4>🚫 NO HACER (Primeras 24 horas)</h4>
<ul>
<li>NO escupir</li>
<li>NO enjuagarse la boca vigorosamente</li>
<li>NO usar popote/pajilla</li>
<li>NO consumir alimentos calientes</li>
<li>NO realizar ejercicio físico intenso</li>
</ul>

<h4>🍽️ ALIMENTACIÓN</h4>
<ul>
<li>Consuma alimentos <strong>blandos y fríos</strong> las primeras 24 horas</li>
<li>Ejemplos: helado, yogurt, licuados, sopas frías</li>
<li>Evite alimentos duros, crujientes o con semillas por 1 semana</li>
</ul>

<h4>🧊 COMPRESAS</h4>
<ul>
<li><strong>Primeras 24 horas:</strong> Aplique compresas FRÍAS (15 min sí, 15 min no)</li>
<li><strong>Después de 48 horas:</strong> Puede aplicar compresas CALIENTES si hay inflamación</li>
</ul>

<h4>🦷 HIGIENE BUCAL</h4>
<ul>
<li>Cepille sus dientes normalmente, evitando la zona de la extracción</li>
<li>A partir del día 2, puede hacer enjuagues suaves con agua tibia y sal</li>
</ul>

<h4>🚭 RESTRICCIONES</h4>
<ul>
<li>NO fumar durante al menos <strong>2 semanas</strong></li>
<li>NO consumir alcohol durante la medicación</li>
</ul>

<h4>💊 MEDICACIÓN</h4>
<p>Tome los medicamentos exactamente como fueron prescritos:</p>
<table style="width:100%; border-collapse: collapse;">
<tr><td style="border:1px solid #ccc; padding:8px;">Medicamento:</td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">Dosis:</td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">Frecuencia:</td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
</table>

<h4>⚠️ SEÑALES DE ALERTA - Contacte a la clínica si presenta:</h4>
<ul>
<li>Sangrado abundante que no cede con presión</li>
<li>Fiebre superior a 38°C</li>
<li>Dolor intenso que no cede con medicación</li>
<li>Inflamación severa o que aumenta después del día 3</li>
<li>Mal sabor u olor en la boca</li>
</ul>

<hr>
<p><strong>Teléfono de Emergencia:</strong> +52 322 183 7666</p>
<p><strong>He recibido y comprendido estas instrucciones:</strong></p>
<p><strong>Firma del Paciente:</strong> ________________________________</p>`,
    fechaCreacion: new Date('2024-01-01'),
    fechaModificacion: new Date('2024-05-20')
  },
  {
    id: '7',
    nombre: 'Recomendaciones Pacientes Ortodoncia',
    categoria: 'Postoperatorio',
    estado: 'Habilitada',
    contenido: `<h1>RECOMENDACIONES PARA PACIENTES</h1>
<h2>TRATAMIENTO DE ORTODONCIA</h2>

<p><strong>Paciente:</strong> ________________________________ <strong>Fecha Inicio:</strong> ______________</p>

<h3>🍎 ALIMENTACIÓN</h3>
<h4>Evite los siguientes alimentos:</h4>
<ul>
<li><strong>Alimentos duros:</strong> nueces, cacahuates, palomitas, hielo, manzana o zanahoria entera</li>
<li><strong>Alimentos pegajosos:</strong> chicle, caramelos, dulces masticables, gomitas</li>
<li><strong>Alimentos fibrosos:</strong> carne en trozo, elote en mazorca</li>
<li><strong>Bebidas oscuras en exceso:</strong> café, té negro, vino tinto (pueden manchar)</li>
</ul>

<h4>✅ Puede consumir:</h4>
<ul>
<li>Frutas y verduras cortadas en trozos pequeños</li>
<li>Carnes blandas o molidas</li>
<li>Lácteos y derivados</li>
<li>Pan suave, pasta, arroz</li>
</ul>

<h3>🪥 HIGIENE</h3>
<h4>Técnica de Cepillado:</h4>
<ol>
<li>Cepille después de cada comida (mínimo 3 veces al día)</li>
<li>Use movimientos rotatorios suaves</li>
<li>Cepille la parte superior e inferior de los brackets</li>
<li>Use cepillos interdentales para limpiar entre brackets</li>
<li>El cepillado debe durar mínimo 3 minutos</li>
</ol>

<h4>Herramientas recomendadas:</h4>
<ul>
<li>Cepillo de ortodoncia (cerdas en V)</li>
<li>Cepillos interdentales</li>
<li>Hilo dental para ortodoncia (con enhebrador)</li>
<li>Enjuague bucal con flúor</li>
<li>Irrigador bucal (Water Pik) - opcional pero recomendado</li>
</ul>

<h3>🔴 LESIONES</h3>
<p>Es normal que aparezcan pequeñas úlceras o rozaduras al inicio del tratamiento.</p>
<ul>
<li>Aplique <strong>cera de ortodoncia</strong> sobre el bracket que cause molestia</li>
<li>Use <strong>Kanka</strong> o anestésico tópico para aliviar el dolor</li>
<li>Las molestias generalmente desaparecen en 3-5 días</li>
</ul>

<h3>💊 DOLOR POST-CONTROL</h3>
<p>Después de cada ajuste puede experimentar molestias:</p>
<ul>
<li>Es normal y dura 2-3 días</li>
<li>Puede tomar antiinflamatorios según indicación</li>
<li>Consuma alimentos blandos esos días</li>
</ul>

<h3>⚠️ DESPRENDIMIENTO DE BRACKETS</h3>
<p>Si se desprende un bracket:</p>
<ol>
<li>Conserve la pieza</li>
<li>Contacte a la clínica para reagendar</li>
<li>Si el alambre causa molestia, use cera para cubrirlo</li>
</ol>

<h3>🎨 CAMBIO DE COLOR</h3>
<p>Las ligas transparentes pueden mancharse. Evite:</p>
<ul>
<li>Curry, salsa de tomate, mostaza</li>
<li>Bebidas con colorante</li>
<li>Tabaco</li>
</ul>

<h3>📅 CITAS DE CONTROL</h3>
<p>Acuda puntualmente a sus citas cada: _____ semanas</p>
<p>Próxima cita: _________________________</p>

<hr>
<p><strong>He recibido y comprendido estas recomendaciones:</strong></p>
<p><strong>Firma del Paciente:</strong> ________________________________</p>`,
    fechaCreacion: new Date('2024-01-01'),
    fechaModificacion: new Date('2024-04-10')
  },
  {
    id: '8',
    nombre: 'Higiene Bucal y Cepillado',
    categoria: 'Educación',
    estado: 'Habilitada',
    contenido: `<h1>GUÍA DE HIGIENE BUCAL</h1>
<h2>TÉCNICA CORRECTA DE CEPILLADO</h2>

<h3>⏰ Frecuencia</h3>
<ul>
<li>Cepille sus dientes <strong>3 veces al día</strong> (después de cada comida principal)</li>
<li>Duración mínima: <strong>2 minutos</strong> cada vez</li>
<li>El cepillado más importante es el de la noche</li>
</ul>

<h3>🪥 Tipo de Cepillo</h3>
<ul>
<li>Use cepillo de <strong>cerdas suaves</strong></li>
<li>Cabeza <strong>pequeña o mediana</strong></li>
<li>Cambie su cepillo cada <strong>3 meses</strong> o cuando las cerdas estén desgastadas</li>
</ul>

<h3>📋 Técnica Correcta</h3>
<ol>
<li><strong>Posición:</strong> Coloque el cepillo en ángulo de 45° hacia la encía</li>
<li><strong>Movimientos:</strong> Realice movimientos cortos de vaivén o circulares</li>
<li><strong>Dirección:</strong> Siempre de la encía hacia el borde del diente</li>
<li><strong>Presión:</strong> Use presión suave, no frote con fuerza</li>
</ol>

<h3>🔄 Orden de Limpieza</h3>
<ol>
<li><strong>Superficies externas:</strong> Todos los dientes por fuera (lado de mejillas)</li>
<li><strong>Superficies internas:</strong> Todos los dientes por dentro (lado de lengua)</li>
<li><strong>Superficies de masticación:</strong> Las caras que mastican</li>
<li><strong>Lengua:</strong> Cepille suavemente de atrás hacia adelante</li>
</ol>

<h3>🧵 Hilo Dental</h3>
<ul>
<li>Use hilo dental <strong>al menos 1 vez al día</strong></li>
<li>Enrolle unos 40 cm de hilo en sus dedos medios</li>
<li>Deslice suavemente entre cada diente</li>
<li>Forme una "C" alrededor del diente y limpie subiendo y bajando</li>
</ul>

<h3>💧 Enjuague Bucal</h3>
<ul>
<li>Use después del cepillado</li>
<li>No enjuague con agua después del enjuague bucal</li>
<li>Espere 30 minutos antes de comer o beber</li>
</ul>

<h3>❌ Errores Comunes</h3>
<ul>
<li>Cepillar muy fuerte (daña encías y esmalte)</li>
<li>Usar cepillo de cerdas duras</li>
<li>No cepillar la lengua</li>
<li>No cambiar el cepillo regularmente</li>
<li>Cepillar horizontal en lugar de circular</li>
</ul>

<p><strong>Recuerde:</strong> Una buena higiene bucal previene caries, enfermedad de encías y mal aliento.</p>`,
    fechaCreacion: new Date('2024-03-01'),
    fechaModificacion: new Date('2024-03-01')
  },
  {
    id: '9',
    nombre: 'Cuidados Post-Blanqueamiento',
    categoria: 'Postoperatorio',
    estado: 'Habilitada',
    contenido: `<h1>CUIDADOS Y RECOMENDACIONES</h1>
<h2>DESPUÉS DEL BLANQUEAMIENTO DENTAL</h2>

<p><strong>Paciente:</strong> ________________________________ <strong>Fecha:</strong> ______________</p>

<h3>⚡ Manejo de Sensibilidad</h3>
<p>Es normal experimentar sensibilidad dental las primeras 24-48 horas:</p>
<ul>
<li>Use pasta dental para sensibilidad</li>
<li>Evite alimentos muy fríos o calientes</li>
<li>La sensibilidad disminuirá gradualmente</li>
</ul>

<h3>🥛 DIETA BLANCA (Primeros 10 días)</h3>
<p>Para mantener los resultados, siga una "dieta blanca" evitando:</p>

<h4>❌ Bebidas a evitar:</h4>
<ul>
<li>Café y té</li>
<li>Vino tinto</li>
<li>Refrescos de cola</li>
<li>Jugos de frutas oscuras (uva, mora, arándano)</li>
<li>Bebidas energéticas con colorante</li>
</ul>

<h4>❌ Alimentos a evitar:</h4>
<ul>
<li>Salsa de tomate, ketchup</li>
<li>Curry, cúrcuma, mostaza</li>
<li>Moras, fresas, cerezas</li>
<li>Chocolate</li>
<li>Remolacha (betabel)</li>
<li>Salsa de soya</li>
</ul>

<h4>✅ Alimentos permitidos:</h4>
<ul>
<li>Pollo, pescado blanco, pavo</li>
<li>Arroz, pasta (sin salsa roja)</li>
<li>Leche, quesos blancos, yogurt natural</li>
<li>Manzana, pera, plátano</li>
<li>Vegetales claros (coliflor, pepino, champiñones)</li>
<li>Pan blanco, cereales claros</li>
</ul>

<h3>🌡️ Temperatura de Alimentos</h3>
<ul>
<li>Evite alimentos y bebidas muy <strong>calientes</strong> o muy <strong>fríos</strong></li>
<li>Consuma a temperatura ambiente o tibia</li>
</ul>

<h3>🚭 PROHIBICIÓN DE TABACO</h3>
<ul>
<li>NO fume durante al menos <strong>48 horas</strong> (idealmente 2 semanas)</li>
<li>El tabaco mancha rápidamente los dientes recién blanqueados</li>
<li>Esto incluye cigarrillos electrónicos</li>
</ul>

<h3>🦷 Procedimientos Dentales</h3>
<p>Espere <strong>10 días</strong> antes de realizar otros tratamientos dentales para que el color se estabilice.</p>

<h3>📋 Mantenimiento</h3>
<ul>
<li>Use pasta dental blanqueadora (no abrasiva)</li>
<li>Considere retoques cada 6-12 meses</li>
<li>Visite al dentista cada 6 meses para limpieza</li>
</ul>

<hr>
<p><strong>He recibido y comprendido estas recomendaciones:</strong></p>
<p><strong>Firma del Paciente:</strong> ________________________________</p>`,
    fechaCreacion: new Date('2024-02-15'),
    fechaModificacion: new Date('2024-02-15')
  },
  {
    id: '10',
    nombre: 'Consentimiento para Endodoncia',
    categoria: 'Consentimiento',
    estado: 'Habilitada',
    contenido: `<h1>CONSENTIMIENTO INFORMADO</h1>
<h2>TRATAMIENTO DE ENDODONCIA (CONDUCTOS)</h2>

<p><strong>Paciente:</strong> ________________________________</p>
<p><strong>Pieza dental:</strong> _____________ <strong>Fecha:</strong> ______________</p>

<h3>¿Qué es la Endodoncia?</h3>
<p>Es el tratamiento del interior del diente (pulpa dental) cuando está infectado, inflamado o necrótico. Consiste en remover el tejido enfermo, desinfectar los conductos y sellarlos.</p>

<h3>Indicaciones del Tratamiento</h3>
<ul>
<li>Dolor dental persistente</li>
<li>Sensibilidad prolongada al frío o calor</li>
<li>Absceso dental</li>
<li>Caries profunda que afecta la pulpa</li>
<li>Trauma dental</li>
</ul>

<h3>Procedimiento</h3>
<ol>
<li>Administración de anestesia local</li>
<li>Aislamiento del diente</li>
<li>Acceso a la cámara pulpar</li>
<li>Limpieza y conformación de conductos</li>
<li>Obturación de conductos</li>
<li>Restauración provisional o definitiva</li>
</ol>

<h3>Riesgos y Complicaciones Posibles</h3>
<ul>
<li>Dolor o molestias postoperatorias (normal primeros días)</li>
<li>Inflamación temporal</li>
<li>Fractura de instrumento dentro del conducto</li>
<li>Perforación de raíz</li>
<li>Conductos calcificados o no localizables</li>
<li>Posible necesidad de retratamiento o cirugía apical</li>
<li>Fractura dental posterior (por debilitamiento)</li>
<li>Posible pérdida del diente a pesar del tratamiento</li>
</ul>

<h3>Alternativas</h3>
<ul>
<li>Extracción dental (y posterior reemplazo con implante o prótesis)</li>
<li>No realizar tratamiento (con riesgo de infección, dolor y pérdida dental)</li>
</ul>

<h3>Después del Tratamiento</h3>
<ul>
<li>Es necesario colocar una corona o restauración definitiva</li>
<li>El diente puede oscurecerse con el tiempo</li>
<li>Se requieren controles radiográficos periódicos</li>
</ul>

<h3>Declaración del Paciente</h3>
<p>☐ He sido informado(a) sobre el tratamiento de endodoncia, sus riesgos y alternativas.</p>
<p>☐ He tenido oportunidad de hacer preguntas y estas fueron respondidas.</p>
<p>☐ Acepto voluntariamente someterme al procedimiento.</p>

<hr>
<p><strong>Firma del Paciente:</strong> ________________________________</p>
<p><strong>Firma del Profesional:</strong> ________________________________</p>
<p><strong>Testigo:</strong> ________________________________</p>`,
    fechaCreacion: new Date('2024-01-20'),
    fechaModificacion: new Date('2024-06-01')
  },
  {
    id: '11',
    nombre: 'Consentimiento para Implantes',
    categoria: 'Consentimiento',
    estado: 'Habilitada',
    contenido: `<h1>CONSENTIMIENTO INFORMADO</h1>
<h2>COLOCACIÓN DE IMPLANTES DENTALES</h2>

<p><strong>Paciente:</strong> ________________________________</p>
<p><strong>Zona de implante(s):</strong> _____________ <strong>Cantidad:</strong> _____</p>
<p><strong>Fecha:</strong> ______________</p>

<h3>¿Qué es un Implante Dental?</h3>
<p>Es un tornillo de titanio que se coloca quirúrgicamente en el hueso maxilar para sustituir la raíz de un diente perdido. Sobre él se coloca una corona o prótesis.</p>

<h3>Procedimiento</h3>
<ol>
<li>Evaluación radiográfica (tomografía)</li>
<li>Planificación quirúrgica digital</li>
<li>Cirugía de colocación bajo anestesia local</li>
<li>Período de integración ósea (3-6 meses)</li>
<li>Colocación del pilar</li>
<li>Toma de impresiones y fabricación de corona</li>
<li>Colocación de corona definitiva</li>
</ol>

<h3>Riesgos y Complicaciones</h3>
<ul>
<li><strong>Durante la cirugía:</strong>
  <ul>
  <li>Sangrado</li>
  <li>Lesión de nervios (parestesia temporal o permanente)</li>
  <li>Perforación del seno maxilar</li>
  <li>Lesión de dientes adyacentes</li>
  </ul>
</li>
<li><strong>Postoperatorios:</strong>
  <ul>
  <li>Dolor e inflamación</li>
  <li>Infección</li>
  <li>Hematoma</li>
  <li>Dehiscencia de sutura</li>
  </ul>
</li>
<li><strong>A largo plazo:</strong>
  <ul>
  <li>Falta de integración ósea (rechazo)</li>
  <li>Periimplantitis (inflamación alrededor del implante)</li>
  <li>Fractura del implante o componentes</li>
  <li>Pérdida del implante</li>
  </ul>
</li>
</ul>

<h3>Factores de Riesgo</h3>
<p>Pueden afectar negativamente el éxito del implante:</p>
<ul>
<li>Tabaquismo</li>
<li>Diabetes no controlada</li>
<li>Enfermedad periodontal</li>
<li>Bruxismo</li>
<li>Osteoporosis</li>
<li>Radioterapia previa</li>
</ul>

<h3>Alternativas</h3>
<ul>
<li>Puente fijo (requiere desgastar dientes adyacentes)</li>
<li>Prótesis removible</li>
<li>No reemplazar el diente</li>
</ul>

<h3>Compromisos del Paciente</h3>
<ul>
<li>Mantener excelente higiene oral</li>
<li>No fumar</li>
<li>Acudir a controles periódicos</li>
<li>Seguir indicaciones postoperatorias</li>
<li>Usar férula de descarga si se indica</li>
</ul>

<h3>Declaración</h3>
<p>He comprendido toda la información proporcionada y acepto el procedimiento.</p>

<hr>
<p><strong>Firma del Paciente:</strong> ________________________________</p>
<p><strong>Firma del Cirujano:</strong> ________________________________</p>
<p><strong>Fecha y hora:</strong> ________________________________</p>`,
    fechaCreacion: new Date('2024-01-25'),
    fechaModificacion: new Date('2024-07-20')
  },
  {
    id: '12',
    nombre: 'Consentimiento Cirugía Tercer Molar',
    categoria: 'Consentimiento',
    estado: 'Habilitada',
    contenido: `<h1>CONSENTIMIENTO INFORMADO</h1>
<h2>EXTRACCIÓN DE TERCER MOLAR (MUELA DEL JUICIO)</h2>

<p><strong>Paciente:</strong> ________________________________</p>
<p><strong>Molar(es) a extraer:</strong> ☐ 18 ☐ 28 ☐ 38 ☐ 48</p>
<p><strong>Fecha:</strong> ______________</p>

<h3>Indicaciones para la Extracción</h3>
<ul>
<li>Falta de espacio para su erupción</li>
<li>Posición anómala (impactado, horizontal, mesioangulado)</li>
<li>Pericoronaritis (infección recurrente)</li>
<li>Caries no restaurable</li>
<li>Indicación ortodóncica</li>
<li>Quistes o tumores asociados</li>
</ul>

<h3>Procedimiento</h3>
<ol>
<li>Anestesia local (o sedación si se indica)</li>
<li>Incisión en encía</li>
<li>Osteotomía (remoción de hueso si es necesario)</li>
<li>Odontosección (división del diente si es necesario)</li>
<li>Extracción del molar</li>
<li>Limpieza del alveolo</li>
<li>Sutura</li>
</ol>

<h3>Riesgos Específicos</h3>
<ul>
<li><strong>Lesión del nervio dentario inferior:</strong> puede causar adormecimiento (parestesia) del labio, mentón o lengua. Puede ser temporal (semanas/meses) o permanente.</li>
<li><strong>Comunicación oroantral:</strong> conexión con el seno maxilar (en superiores)</li>
<li><strong>Alveolitis seca:</strong> complicación dolorosa por pérdida del coágulo</li>
<li><strong>Fractura de mandíbula:</strong> raro, en casos de hueso debilitado</li>
<li><strong>Daño a dientes adyacentes</strong></li>
<li><strong>Infección postoperatoria</strong></li>
<li><strong>Trismo:</strong> dificultad para abrir la boca</li>
</ul>

<h3>Postoperatorio Esperado</h3>
<ul>
<li>Inflamación máxima a las 48-72 horas</li>
<li>Hematoma facial (posible)</li>
<li>Molestias al masticar por varios días</li>
<li>Retiro de puntos a los 7-10 días</li>
</ul>

<h3>Alternativa</h3>
<p>No extraer: implica riesgo de infecciones recurrentes, daño a dientes vecinos, quistes o reabsorción radicular.</p>

<h3>Declaración</h3>
<p>☐ Comprendo los riesgos específicos de la extracción de tercer molar</p>
<p>☐ He informado sobre mi historial médico completo</p>
<p>☐ Acepto el procedimiento</p>

<hr>
<p><strong>Firma del Paciente:</strong> ________________________________</p>
<p><strong>Firma del Cirujano:</strong> ________________________________</p>`,
    fechaCreacion: new Date('2024-02-01'),
    fechaModificacion: new Date('2024-08-15')
  },
  {
    id: '13',
    nombre: 'Consentimiento Ortodoncia',
    categoria: 'Consentimiento',
    estado: 'Habilitada',
    contenido: `<h1>CONSENTIMIENTO INFORMADO</h1>
<h2>TRATAMIENTO DE ORTODONCIA</h2>

<p><strong>Paciente:</strong> ________________________________</p>
<p><strong>Representante (si menor):</strong> ________________________________</p>
<p><strong>Tipo de aparatología:</strong> ☐ Brackets metálicos ☐ Brackets estéticos ☐ Alineadores ☐ Otro: _______</p>
<p><strong>Fecha inicio:</strong> ______________</p>

<h3>Objetivos del Tratamiento</h3>
<ul>
<li>Corregir la posición de los dientes</li>
<li>Mejorar la mordida (oclusión)</li>
<li>Optimizar la estética de la sonrisa</li>
<li>Mejorar la función masticatoria</li>
</ul>

<h3>Duración Estimada</h3>
<p>El tratamiento tiene una duración estimada de _____ a _____ meses. Esta duración puede variar según:</p>
<ul>
<li>Cooperación del paciente</li>
<li>Respuesta biológica individual</li>
<li>Complejidad del caso</li>
<li>Asistencia puntual a las citas</li>
</ul>

<h3>Riesgos y Complicaciones</h3>
<ul>
<li><strong>Caries y descalcificación:</strong> por higiene deficiente alrededor de brackets</li>
<li><strong>Enfermedad periodontal:</strong> inflamación de encías</li>
<li><strong>Reabsorción radicular:</strong> acortamiento de raíces</li>
<li><strong>Recidiva:</strong> tendencia de los dientes a volver a su posición original</li>
<li><strong>Problemas de ATM:</strong> dolor o ruidos articulares</li>
<li><strong>Dolor y molestias:</strong> especialmente después de ajustes</li>
<li><strong>Úlceras y rozaduras:</strong> por contacto con aparatos</li>
<li><strong>Manchas blancas:</strong> por desmineralización</li>
</ul>

<h3>Responsabilidades del Paciente</h3>
<ul>
<li>Mantener higiene oral impecable</li>
<li>Seguir indicaciones de alimentación</li>
<li>Usar elásticos, retenedores y aditamentos según indicación</li>
<li>Acudir puntualmente a citas de control</li>
<li>Comunicar cualquier problema con los aparatos</li>
<li>Usar retenedores de por vida después del tratamiento</li>
</ul>

<h3>Costos Adicionales Posibles</h3>
<ul>
<li>Brackets desprendidos (por alimentos duros)</li>
<li>Reposición de alineadores perdidos</li>
<li>Extensión del tiempo de tratamiento</li>
<li>Procedimientos complementarios (extracciones, cirugía)</li>
</ul>

<h3>Retención</h3>
<p>Después del tratamiento activo, es OBLIGATORIO usar retenedores para mantener los resultados. Sin retención, los dientes tienden a moverse.</p>

<h3>Declaración</h3>
<p>☐ He leído y comprendido toda la información</p>
<p>☐ Acepto iniciar el tratamiento de ortodoncia</p>
<p>☐ Me comprometo a seguir las indicaciones</p>

<hr>
<p><strong>Firma del Paciente/Representante:</strong> ________________________________</p>
<p><strong>Firma del Ortodoncista:</strong> ________________________________</p>`,
    fechaCreacion: new Date('2024-01-15'),
    fechaModificacion: new Date('2024-09-01')
  },
  {
    id: '14',
    nombre: 'Consentimiento Blanqueamiento',
    categoria: 'Consentimiento',
    estado: 'Habilitada',
    contenido: `<h1>CONSENTIMIENTO INFORMADO</h1>
<h2>BLANQUEAMIENTO DENTAL</h2>

<p><strong>Paciente:</strong> ________________________________</p>
<p><strong>Tipo:</strong> ☐ En consultorio (LED/Láser) ☐ Ambulatorio (férulas) ☐ Combinado</p>
<p><strong>Fecha:</strong> ______________</p>

<h3>¿Qué es el Blanqueamiento Dental?</h3>
<p>Es un tratamiento estético que utiliza agentes químicos (peróxido de hidrógeno o carbamida) para aclarar el color de los dientes.</p>

<h3>Limitaciones del Tratamiento</h3>
<ul>
<li>El grado de aclaramiento varía según cada persona</li>
<li>No aclara restauraciones existentes (resinas, coronas)</li>
<li>Algunos tipos de manchas no responden al blanqueamiento</li>
<li>Los resultados no son permanentes</li>
<li>Pueden necesitarse retoques periódicos</li>
</ul>

<h3>Efectos Secundarios</h3>
<ul>
<li><strong>Sensibilidad dental:</strong> es el efecto más común, generalmente temporal (24-48 horas)</li>
<li><strong>Irritación gingival:</strong> si el gel contacta las encías</li>
<li><strong>Sensación de "agujas":</strong> en algunos pacientes</li>
<li><strong>Resultados desiguales:</strong> algunas zonas pueden aclarar más que otras</li>
</ul>

<h3>Contraindicaciones</h3>
<ul>
<li>Embarazo y lactancia</li>
<li>Menores de 16 años</li>
<li>Alergia al peróxido</li>
<li>Enfermedad periodontal activa</li>
<li>Caries no tratadas</li>
<li>Exposición radicular severa</li>
</ul>

<h3>Cuidados Posteriores</h3>
<ul>
<li>Dieta blanca por 10-14 días</li>
<li>Evitar tabaco</li>
<li>Usar pasta para sensibilidad</li>
<li>Evitar alimentos y bebidas que manchen</li>
</ul>

<h3>Resultado Esperado</h3>
<p>El color actual de mis dientes es: _____ (escala VITA)</p>
<p>El resultado esperado es de: _____ a _____ tonos más claros</p>
<p>(No se garantiza un color específico)</p>

<h3>Declaración</h3>
<p>☐ Entiendo que los resultados varían según cada persona</p>
<p>☐ Acepto que pueden presentarse efectos secundarios temporales</p>
<p>☐ Me comprometo a seguir las indicaciones postratamiento</p>

<hr>
<p><strong>Firma del Paciente:</strong> ________________________________</p>
<p><strong>Firma del Profesional:</strong> ________________________________</p>`,
    fechaCreacion: new Date('2024-02-10'),
    fechaModificacion: new Date('2024-02-10')
  },
  {
    id: '15',
    nombre: 'Cuidados Postoperatorios Cirugía Periodontal',
    categoria: 'Postoperatorio',
    estado: 'Habilitada',
    contenido: `<h1>CUIDADOS POST-OPERATORIOS</h1>
<h2>CIRUGÍA PERIODONTAL</h2>

<p><strong>Paciente:</strong> ________________________________</p>
<p><strong>Procedimiento realizado:</strong> ________________________________</p>
<p><strong>Fecha:</strong> ______________</p>

<h3>Primeras 24 Horas</h3>
<ul>
<li>Aplique hielo en la zona externa (20 min sí, 20 min no)</li>
<li>No escupa, no use popote</li>
<li>No enjuague la boca</li>
<li>Dieta líquida o blanda FRÍA</li>
<li>Repose con la cabeza elevada</li>
</ul>

<h3>Después de 24 Horas</h3>
<ul>
<li>Enjuagues suaves con clorhexidina 0.12% (2 veces al día por 2 semanas)</li>
<li>No cepille la zona operada hasta que se indique</li>
<li>Cepille el resto de los dientes normalmente</li>
</ul>

<h3>Alimentación</h3>
<table style="width:100%; border-collapse: collapse;">
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Permitido:</strong></td><td style="border:1px solid #ccc; padding:8px;">Sopas, purés, huevo revuelto, yogurt, licuados</td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Evitar:</strong></td><td style="border:1px solid #ccc; padding:8px;">Alimentos duros, crujientes, picantes, con semillas</td></tr>
</table>

<h3>Medicación Prescrita</h3>
<table style="width:100%; border-collapse: collapse;">
<tr><td style="border:1px solid #ccc; padding:8px;">Antibiótico:</td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;">cada ___ horas por ___ días</td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">Antiinflamatorio:</td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;">cada ___ horas por ___ días</td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">Enjuague:</td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;">___ veces al día</td></tr>
</table>

<h3>Signos de Alerta</h3>
<p>Contacte a la clínica si presenta:</p>
<ul>
<li>Sangrado abundante que no cede</li>
<li>Fiebre mayor a 38°C</li>
<li>Dolor intenso no controlado con medicación</li>
<li>Inflamación que aumenta después del día 3</li>
<li>Pus o secreción</li>
<li>Desprendimiento de puntos antes de tiempo</li>
</ul>

<h3>Retiro de Puntos</h3>
<p>Cita programada: ________________________</p>

<hr>
<p><strong>He recibido estas instrucciones:</strong></p>
<p><strong>Firma:</strong> ________________________________</p>`,
    fechaCreacion: new Date('2024-03-10'),
    fechaModificacion: new Date('2024-03-10')
  },
  {
    id: '16',
    nombre: 'Carta de Referencia Especialista',
    categoria: 'Referencia',
    estado: 'Habilitada',
    contenido: `<h1>CARTA DE REFERENCIA</h1>

<p><strong>Fecha:</strong> ______________</p>
<p><strong>Estimado(a) Dr./Dra.:</strong> ________________________________</p>
<p><strong>Especialidad:</strong> ________________________________</p>

<hr>

<h3>Datos del Paciente</h3>
<table style="width:100%; border-collapse: collapse;">
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Nombre:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Edad:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Teléfono:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
</table>

<h3>Motivo de Referencia</h3>
<p>____________________________________________________________________</p>
<p>____________________________________________________________________</p>

<h3>Diagnóstico Actual</h3>
<p>____________________________________________________________________</p>
<p>____________________________________________________________________</p>

<h3>Tratamientos Realizados</h3>
<ul>
<li>____________________________________________________________________</li>
<li>____________________________________________________________________</li>
</ul>

<h3>Estudios Adjuntos</h3>
<p>☐ Radiografías periapicales</p>
<p>☐ Radiografía panorámica</p>
<p>☐ Tomografía (CBCT)</p>
<p>☐ Fotografías clínicas</p>
<p>☐ Modelos de estudio</p>
<p>☐ Otros: ________________</p>

<h3>Información Médica Relevante</h3>
<p>____________________________________________________________________</p>

<h3>Solicitud Específica</h3>
<p>____________________________________________________________________</p>

<hr>

<p>Agradezco de antemano su atención. Quedo a sus órdenes para cualquier información adicional.</p>

<p><strong>Atentamente,</strong></p>
<p><strong>Dr./Dra.:</strong> ________________________________</p>
<p><strong>Cédula Profesional:</strong> ________________________________</p>
<p><strong>Especialidad:</strong> ________________________________</p>

<hr>
<p><strong>NovellDent Clínica Dental</strong></p>
<p>Tel: +52 322 183 7666 | www.novelldent.com</p>`,
    fechaCreacion: new Date('2024-04-01'),
    fechaModificacion: new Date('2024-04-01')
  },
  {
    id: '17',
    nombre: 'Receta Médica',
    categoria: 'Prescripción',
    estado: 'Habilitada',
    contenido: `<h1 style="text-align:center;">RECETA MÉDICA</h1>
<h2 style="text-align:center;">NovellDent Clínica Dental</h2>

<hr>

<table style="width:100%;">
<tr><td><strong>Fecha:</strong> ______________</td><td style="text-align:right;"><strong>Folio:</strong> ______________</td></tr>
</table>

<h3>Datos del Paciente</h3>
<p><strong>Nombre:</strong> ________________________________________________</p>
<p><strong>Edad:</strong> _______ años &nbsp;&nbsp;&nbsp; <strong>Peso:</strong> _______ kg</p>

<hr>

<h3>Rp/</h3>

<table style="width:100%; border-collapse: collapse; margin: 20px 0;">
<tr>
<td style="border-bottom:1px solid #ccc; padding:15px;">
<strong>1.</strong> ________________________________________________<br>
&nbsp;&nbsp;&nbsp;&nbsp;Presentación: _______________________<br>
&nbsp;&nbsp;&nbsp;&nbsp;Dosis: _______ cada _______ horas por _______ días<br>
&nbsp;&nbsp;&nbsp;&nbsp;Indicaciones: _______________________
</td>
</tr>
<tr>
<td style="border-bottom:1px solid #ccc; padding:15px;">
<strong>2.</strong> ________________________________________________<br>
&nbsp;&nbsp;&nbsp;&nbsp;Presentación: _______________________<br>
&nbsp;&nbsp;&nbsp;&nbsp;Dosis: _______ cada _______ horas por _______ días<br>
&nbsp;&nbsp;&nbsp;&nbsp;Indicaciones: _______________________
</td>
</tr>
<tr>
<td style="border-bottom:1px solid #ccc; padding:15px;">
<strong>3.</strong> ________________________________________________<br>
&nbsp;&nbsp;&nbsp;&nbsp;Presentación: _______________________<br>
&nbsp;&nbsp;&nbsp;&nbsp;Dosis: _______ cada _______ horas por _______ días<br>
&nbsp;&nbsp;&nbsp;&nbsp;Indicaciones: _______________________
</td>
</tr>
</table>

<h3>Indicaciones Generales</h3>
<p>____________________________________________________________________</p>
<p>____________________________________________________________________</p>

<hr>

<table style="width:100%; margin-top:30px;">
<tr>
<td style="width:50%;">
<p><strong>Médico:</strong> ________________________</p>
<p><strong>Cédula Prof.:</strong> ________________________</p>
<p><strong>Especialidad:</strong> ________________________</p>
</td>
<td style="width:50%; text-align:center;">
<p>&nbsp;</p>
<p>_______________________________</p>
<p><strong>Firma y Sello</strong></p>
</td>
</tr>
</table>

<hr>
<p style="text-align:center; font-size:12px;">
NovellDent Clínica Dental | Tel: +52 322 183 7666 | www.novelldent.com
</p>`,
    fechaCreacion: new Date('2024-01-01'),
    fechaModificacion: new Date('2024-01-01')
  },
  {
    id: '18',
    nombre: 'Plan de Tratamiento',
    categoria: 'Tratamiento',
    estado: 'Habilitada',
    contenido: `<h1>PLAN DE TRATAMIENTO</h1>
<h2>NovellDent Clínica Dental</h2>

<h3>Datos del Paciente</h3>
<table style="width:100%; border-collapse: collapse;">
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Nombre:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Fecha:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Doctor:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
</table>

<h3>Diagnóstico</h3>
<p>____________________________________________________________________</p>
<p>____________________________________________________________________</p>

<h3>Tratamientos Propuestos</h3>
<table style="width:100%; border-collapse: collapse;">
<tr style="background:#f0f0f0;">
<th style="border:1px solid #ccc; padding:8px;">No.</th>
<th style="border:1px solid #ccc; padding:8px;">Tratamiento</th>
<th style="border:1px solid #ccc; padding:8px;">Pieza</th>
<th style="border:1px solid #ccc; padding:8px;">Costo</th>
</tr>
<tr><td style="border:1px solid #ccc; padding:8px;">1</td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;">$</td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">2</td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;">$</td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">3</td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;">$</td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">4</td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;">$</td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;">5</td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;">$</td></tr>
<tr style="background:#f0f0f0;">
<td style="border:1px solid #ccc; padding:8px;" colspan="3"><strong>TOTAL</strong></td>
<td style="border:1px solid #ccc; padding:8px;"><strong>$</strong></td>
</tr>
</table>

<h3>Forma de Pago</h3>
<p>☐ Contado &nbsp;&nbsp; ☐ 2 pagos &nbsp;&nbsp; ☐ 3 pagos &nbsp;&nbsp; ☐ Otro: _______</p>
<p><strong>Anticipo:</strong> $___________ <strong>Fecha:</strong> ___________</p>

<h3>Duración Estimada</h3>
<p>El tratamiento completo tiene una duración estimada de: ____________</p>
<p>Número aproximado de citas: ____________</p>

<h3>Notas</h3>
<p>____________________________________________________________________</p>
<p>____________________________________________________________________</p>

<h3>Aceptación del Plan</h3>
<p>He revisado el plan de tratamiento propuesto, incluyendo los procedimientos y costos. Acepto iniciar el tratamiento según lo establecido.</p>

<hr>
<p><strong>Firma del Paciente:</strong> ________________________________</p>
<p><strong>Firma del Doctor:</strong> ________________________________</p>
<p><strong>Fecha:</strong> ______________</p>`,
    fechaCreacion: new Date('2024-01-01'),
    fechaModificacion: new Date('2024-05-01')
  },
  {
    id: '19',
    nombre: 'Nota de Evolución',
    categoria: 'Evolución',
    estado: 'Habilitada',
    contenido: `<h1>NOTA DE EVOLUCIÓN</h1>

<h3>Datos del Paciente</h3>
<table style="width:100%; border-collapse: collapse;">
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Nombre:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;"><strong>No. Exp:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Fecha:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td><td style="border:1px solid #ccc; padding:8px;"><strong>Hora:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
</table>

<h3>Subjetivo (S)</h3>
<p><em>Síntomas referidos por el paciente:</em></p>
<p>____________________________________________________________________</p>
<p>____________________________________________________________________</p>

<h3>Objetivo (O)</h3>
<p><em>Hallazgos clínicos:</em></p>
<p>____________________________________________________________________</p>
<p>____________________________________________________________________</p>

<h3>Análisis (A)</h3>
<p><em>Diagnóstico o impresión diagnóstica:</em></p>
<p>____________________________________________________________________</p>
<p>____________________________________________________________________</p>

<h3>Plan (P)</h3>
<p><em>Tratamiento realizado y/o indicado:</em></p>
<p>____________________________________________________________________</p>
<p>____________________________________________________________________</p>

<h3>Procedimiento Realizado</h3>
<table style="width:100%; border-collapse: collapse;">
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Pieza(s):</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Tratamiento:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Material utilizado:</strong></td><td style="border:1px solid #ccc; padding:8px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:8px;"><strong>Anestesia:</strong></td><td style="border:1px solid #ccc; padding:8px;">☐ Sí ☐ No &nbsp; Tipo: _________</td></tr>
</table>

<h3>Indicaciones al Paciente</h3>
<p>____________________________________________________________________</p>
<p>____________________________________________________________________</p>

<h3>Próxima Cita</h3>
<p><strong>Fecha:</strong> ______________ <strong>Hora:</strong> ______________ <strong>Tratamiento:</strong> ______________</p>

<hr>
<p><strong>Médico Tratante:</strong> ________________________________</p>
<p><strong>Cédula:</strong> ________________________________</p>
<p><strong>Firma:</strong> ________________________________</p>`,
    fechaCreacion: new Date('2024-01-01'),
    fechaModificacion: new Date('2024-01-01')
  },
  {
    id: '20',
    nombre: 'Constancia de Atención',
    categoria: 'Legal',
    estado: 'Habilitada',
    contenido: `<h1 style="text-align:center;">CONSTANCIA DE ATENCIÓN MÉDICA</h1>
<h2 style="text-align:center;">NovellDent Clínica Dental</h2>

<hr>

<p style="text-align:right;"><strong>Fecha:</strong> ____________________</p>
<p style="text-align:right;"><strong>Folio:</strong> ____________________</p>

<h3>A QUIEN CORRESPONDA:</h3>

<p>Por medio de la presente, se hace constar que el/la paciente:</p>

<table style="width:100%; border-collapse: collapse; margin: 20px 0;">
<tr><td style="border:1px solid #ccc; padding:10px;"><strong>Nombre completo:</strong></td><td style="border:1px solid #ccc; padding:10px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:10px;"><strong>Edad:</strong></td><td style="border:1px solid #ccc; padding:10px;"></td></tr>
</table>

<p>Acudió a consulta en esta clínica dental el día <strong>_____________</strong> a las <strong>_______</strong> horas, siendo atendido(a) por:</p>

<table style="width:100%; border-collapse: collapse; margin: 20px 0;">
<tr><td style="border:1px solid #ccc; padding:10px;"><strong>Procedimiento realizado:</strong></td><td style="border:1px solid #ccc; padding:10px;"></td></tr>
<tr><td style="border:1px solid #ccc; padding:10px;"><strong>Duración de la cita:</strong></td><td style="border:1px solid #ccc; padding:10px;"></td></tr>
</table>

<p>Se indica reposo: ☐ No ☐ Sí, por _______ día(s)</p>

<h3>Observaciones</h3>
<p>____________________________________________________________________</p>
<p>____________________________________________________________________</p>

<p>Se extiende la presente constancia para los fines que al interesado convengan.</p>

<hr>

<table style="width:100%; margin-top:40px;">
<tr>
<td style="width:50%;">
<p><strong>Dr./Dra.:</strong> ________________________</p>
<p><strong>Cédula Profesional:</strong> ________________</p>
<p><strong>Especialidad:</strong> ______________________</p>
</td>
<td style="width:50%; text-align:center;">
<p>&nbsp;</p>
<p>_______________________________</p>
<p><strong>Firma y Sello</strong></p>
</td>
</tr>
</table>

<hr>
<p style="text-align:center; font-size:11px;">
<strong>NovellDent Clínica Dental</strong><br>
Dirección: Puerto Vallarta, Jalisco, México<br>
Tel: +52 322 183 7666 | Email: contacto@novelldent.com | www.novelldent.com
</p>`,
    fechaCreacion: new Date('2024-01-01'),
    fechaModificacion: new Date('2024-01-01')
  }
];

// Document Categories
const CATEGORIES = [
  { id: 'all', label: 'Todos', color: 'bg-gray-500' },
  { id: 'Diagnóstico', label: 'Diagnóstico', color: 'bg-blue-500' },
  { id: 'Legal', label: 'Legal', color: 'bg-purple-500' },
  { id: 'Consentimiento', label: 'Consentimiento', color: 'bg-green-500' },
  { id: 'Postoperatorio', label: 'Postoperatorio', color: 'bg-orange-500' },
  { id: 'Educación', label: 'Educación', color: 'bg-cyan-500' },
  { id: 'Referencia', label: 'Referencia', color: 'bg-indigo-500' },
  { id: 'Prescripción', label: 'Prescripción', color: 'bg-red-500' },
  { id: 'Tratamiento', label: 'Tratamiento', color: 'bg-teal-500' },
  { id: 'Evolución', label: 'Evolución', color: 'bg-amber-500' },
];

// Menu Button Component
const EditorMenuButton = ({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn("h-8 w-8 p-0", isActive && "bg-primary/20 text-primary")}
  >
    {children}
  </Button>
);

// Enhanced Editor Toolbar
const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  if (!editor) return null;

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
      setLinkUrl("");
    }
  };

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
      {/* History */}
      <EditorMenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Deshacer">
        <Undo className="h-4 w-4" />
      </EditorMenuButton>
      <EditorMenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rehacer">
        <Redo className="h-4 w-4" />
      </EditorMenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Headings */}
      <EditorMenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} title="Título 1">
        <Heading1 className="h-4 w-4" />
      </EditorMenuButton>
      <EditorMenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="Título 2">
        <Heading2 className="h-4 w-4" />
      </EditorMenuButton>
      <EditorMenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} title="Título 3">
        <Heading3 className="h-4 w-4" />
      </EditorMenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text formatting */}
      <EditorMenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Negrita">
        <Bold className="h-4 w-4" />
      </EditorMenuButton>
      <EditorMenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Cursiva">
        <Italic className="h-4 w-4" />
      </EditorMenuButton>
      <EditorMenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Subrayado">
        <UnderlineIcon className="h-4 w-4" />
      </EditorMenuButton>
      <EditorMenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Tachado">
        <Strikethrough className="h-4 w-4" />
      </EditorMenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Alignment */}
      <EditorMenuButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="Alinear izquierda">
        <AlignLeft className="h-4 w-4" />
      </EditorMenuButton>
      <EditorMenuButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="Centrar">
        <AlignCenter className="h-4 w-4" />
      </EditorMenuButton>
      <EditorMenuButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="Alinear derecha">
        <AlignRight className="h-4 w-4" />
      </EditorMenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Lists */}
      <EditorMenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Lista">
        <List className="h-4 w-4" />
      </EditorMenuButton>
      <EditorMenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Lista numerada">
        <ListOrdered className="h-4 w-4" />
      </EditorMenuButton>
      <EditorMenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Cita">
        <Quote className="h-4 w-4" />
      </EditorMenuButton>
      <EditorMenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Línea horizontal">
        <Minus className="h-4 w-4" />
      </EditorMenuButton>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Table */}
      <EditorMenuButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insertar tabla"
      >
        <Table2 className="h-4 w-4" />
      </EditorMenuButton>

      {editor.isActive('table') && (
        <>
          <EditorMenuButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Agregar columna">
            <Columns className="h-4 w-4" />
          </EditorMenuButton>
          <EditorMenuButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Agregar fila">
            <Rows className="h-4 w-4" />
          </EditorMenuButton>
          <EditorMenuButton onClick={() => editor.chain().focus().deleteTable().run()} title="Eliminar tabla">
            <Trash2 className="h-4 w-4 text-destructive" />
          </EditorMenuButton>
        </>
      )}

      <div className="w-px h-6 bg-border mx-1" />

      {/* Link */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className={cn("h-8 w-8 p-0", editor.isActive("link") && "bg-primary/20 text-primary")} title="Enlace">
            <LinkIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-popover" align="start">
          <div className="flex gap-2">
            <Input placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLink()} />
            <Button size="sm" onClick={addLink}>Añadir</Button>
          </div>
          {editor.isActive("link") && (
            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => editor.chain().focus().unsetLink().run()}>
              Quitar enlace
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Image */}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Imagen">
            <ImageIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-popover" align="start">
          <div className="flex gap-2">
            <Input placeholder="URL de imagen..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addImage()} />
            <Button size="sm" onClick={addImage}>Añadir</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Main Component
export const ClinicalDocumentsEditor = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ClinicalDocument[]>(CLINICAL_DOCUMENTS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDoc, setEditingDoc] = useState<ClinicalDocument | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Diagnóstico');

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Image.configure({ HTMLAttributes: { class: "max-w-full h-auto rounded-lg my-4" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: editorContent,
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none p-4 min-h-[400px] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
  });

  // Update editor content when editing doc changes
  const handleEditDocument = useCallback((doc: ClinicalDocument) => {
    setEditingDoc(doc);
    setEditorContent(doc.contenido);
    if (editor) {
      editor.commands.setContent(doc.contenido);
    }
  }, [editor]);

  const handleSaveDocument = () => {
    if (editingDoc) {
      setDocuments(documents.map(d =>
        d.id === editingDoc.id ? { ...d, contenido: editorContent, fechaModificacion: new Date() } : d
      ));
      setEditingDoc(null);
      setEditorContent('');
      toast({ title: "Documento guardado", description: "Los cambios se han guardado correctamente" });
    }
  };

  const handleDuplicateDocument = (doc: ClinicalDocument) => {
    const newDoc: ClinicalDocument = {
      ...doc,
      id: crypto.randomUUID(),
      nombre: `${doc.nombre} (Copia)`,
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
    };
    setDocuments([newDoc, ...documents]);
    toast({ title: "Documento duplicado" });
  };

  const handleToggleStatus = (doc: ClinicalDocument) => {
    setDocuments(documents.map(d =>
      d.id === doc.id ? { ...d, estado: d.estado === 'Habilitada' ? 'Deshabilitada' : 'Habilitada' } : d
    ));
    toast({ title: doc.estado === 'Habilitada' ? "Documento deshabilitado" : "Documento habilitado" });
  };

  const handleCreateDocument = () => {
    if (newDocName.trim()) {
      const newDoc: ClinicalDocument = {
        id: crypto.randomUUID(),
        nombre: newDocName,
        categoria: newDocCategory,
        estado: 'Habilitada',
        contenido: `<h1>${newDocName}</h1><p>Contenido del documento...</p>`,
        fechaCreacion: new Date(),
        fechaModificacion: new Date(),
      };
      setDocuments([newDoc, ...documents]);
      setNewDocName('');
      setShowNewDoc(false);
      handleEditDocument(newDoc);
    }
  };

  const handlePrintDocument = (doc: ClinicalDocument) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${doc.nombre} - NovellDent</title>
        <style>
          body { font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
          h1 { color: #1a5f7a; border-bottom: 2px solid #1a5f7a; padding-bottom: 10px; }
          h2 { color: #2a7f9a; }
          h3 { color: #3a9fba; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          td, th { border: 1px solid #ddd; padding: 8px; }
          ul, ol { margin: 10px 0; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        ${doc.contenido}
        <div class="footer">
          NovellDent Clínica Dental | Tel: +52 322 183 7666 | www.novelldent.com
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

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.categoria === selectedCategory;
    const matchesSearch = doc.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Editing View
  if (editingDoc) {
    return (
      <div className="h-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Edit2 className="w-6 h-6" />
              Editando: {editingDoc.nombre}
            </h2>
            <p className="text-muted-foreground">Editor WYSIWYG completo con tablas y formato enriquecido</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Ocultar' : 'Vista Previa'}
            </Button>
            <Button variant="outline" onClick={() => { setEditingDoc(null); setEditorContent(''); }}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveDocument}>
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </div>
        </div>

        <div className={cn("flex-1 grid gap-4", showPreview ? "grid-cols-2" : "grid-cols-1")}>
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Editor de Documento</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="border rounded-lg overflow-hidden h-full">
                <EditorToolbar editor={editor} />
                <ScrollArea className="h-[calc(100%-48px)]">
                  <EditorContent editor={editor} />
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {showPreview && (
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Vista Previa</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <ScrollArea className="h-full">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none p-4 border rounded-lg bg-muted/30"
                    dangerouslySetInnerHTML={{ __html: editorContent }}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Document List View
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Documentos Clínicos
          </h2>
          <p className="text-muted-foreground">
            {documents.length} documentos disponibles • Editor WYSIWYG con TipTap
          </p>
        </div>
        <Button onClick={() => setShowNewDoc(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Documento
        </Button>
      </div>

      {/* New Document Form */}
      {showNewDoc && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label>Nombre del Documento</Label>
                <Input
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="Ej: Consentimiento para Carillas"
                  className="mt-1"
                />
              </div>
              <div className="w-48">
                <Label>Categoría</Label>
                <select
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md bg-background"
                >
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <Button variant="outline" onClick={() => setShowNewDoc(false)}>Cancelar</Button>
              <Button onClick={handleCreateDocument}>Crear y Editar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
        <ScrollArea className="flex-1">
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Documents Table */}
      <Card className="flex-1">
        <ScrollArea className="h-full">
          <UITable>
            <UITableHeader>
              <UITableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Modificación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </UITableRow>
            </UITableHeader>
            <TableBody>
              {filteredDocuments.map(doc => (
                <UITableRow key={doc.id}>
                  <UITableCell className="font-medium">{doc.nombre}</UITableCell>
                  <UITableCell>
                    <Badge variant="secondary">{doc.categoria}</Badge>
                  </UITableCell>
                  <UITableCell>
                    <Badge className={doc.estado === 'Habilitada' ? 'bg-green-500' : 'bg-gray-400'}>
                      {doc.estado}
                    </Badge>
                  </UITableCell>
                  <UITableCell className="text-muted-foreground text-sm">
                    {doc.fechaModificacion.toLocaleDateString('es-MX')}
                  </UITableCell>
                  <UITableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditDocument(doc)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleDuplicateDocument(doc)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintDocument(doc)}>
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleStatus(doc)}>
                            <XCircle className="w-4 h-4 mr-2" />
                            {doc.estado === 'Habilitada' ? 'Deshabilitar' : 'Habilitar'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </UITableCell>
                </UITableRow>
              ))}
            </TableBody>
          </UITable>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default ClinicalDocumentsEditor;
