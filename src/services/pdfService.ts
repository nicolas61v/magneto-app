//src/services/pdfService.ts
import { CVData } from '@/types/cv';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Typescript declaration for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }
}

interface AutoTableOptions {
  head?: Array<Array<string>>;
  body?: Array<Array<string | number>>;
  startY?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  theme?: string;
  styles?: object;
  headStyles?: object;
  bodyStyles?: object;
  columnStyles?: object;
  tableWidth?: string | number;
}

export const generatePdf = async (cvData: CVData): Promise<string> => {
  try {
    const { personalInfo, education, experience, skills, summary, languages } = cvData;
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Configuración de colores
    const primaryColor = [79, 70, 229]; // Índigo
    const textColor = [55, 65, 81]; // Gris oscuro
    
    let yPosition = 20;
    
    // TÍTULO
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Currículum Vitae', 105, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Línea separadora
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 15;
    
    // INFORMACIÓN PERSONAL
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN PERSONAL', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'normal');
    
    if (personalInfo.name) {
      doc.setFont('helvetica', 'bold');
      doc.text('Nombre: ', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(personalInfo.name, 45, yPosition);
      yPosition += 6;
    }
    
    if (personalInfo.email && personalInfo.email !== 'null' && personalInfo.email !== 'no proporcionado') {
      doc.setFont('helvetica', 'bold');
      doc.text('Email: ', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(personalInfo.email, 45, yPosition);
      yPosition += 6;
    }
    
    if (personalInfo.phone) {
      doc.setFont('helvetica', 'bold');
      doc.text('Teléfono: ', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(personalInfo.phone, 50, yPosition);
      yPosition += 6;
    }
    
    if (personalInfo.location) {
      doc.setFont('helvetica', 'bold');
      doc.text('Ubicación: ', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(personalInfo.location, 55, yPosition);
      yPosition += 6;
    }
    
    yPosition += 10;
    
    // RESUMEN PROFESIONAL
    if (summary && summary.trim() !== '') {
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN PROFESIONAL', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont('helvetica', 'normal');
      
      const splitSummary = doc.splitTextToSize(summary, 170);
      doc.text(splitSummary, 20, yPosition);
      yPosition += splitSummary.length * 5 + 10;
    }
    
    // EXPERIENCIA LABORAL
    if (experience && experience.length > 0) {
      // Verificar si necesitamos nueva página
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('EXPERIENCIA LABORAL', 20, yPosition);
      yPosition += 10;
      
      experience.forEach((exp) => {
        // Verificar espacio en página
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        // Puesto y empresa
        const jobTitle = `${exp.position || 'Puesto no especificado'}`;
        const company = exp.company ? ` en ${exp.company}` : '';
        doc.text(`${jobTitle}${company}`, 20, yPosition);
        yPosition += 6;
        
        // Fechas
        if (exp.startDate || exp.endDate) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 100, 100);
          const dateRange = `${exp.startDate || ''} - ${exp.endDate || 'Presente'}`;
          doc.text(dateRange, 20, yPosition);
          yPosition += 6;
        }
        
        // Descripción
        if (exp.description && exp.description.trim() !== '') {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          
          const splitDescription = doc.splitTextToSize(exp.description, 170);
          doc.text(splitDescription, 20, yPosition);
          yPosition += splitDescription.length * 5;
        }
        
        yPosition += 8;
      });
    }
    
    // EDUCACIÓN
    if (education && education.length > 0) {
      // Verificar si necesitamos nueva página
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('EDUCACIÓN', 20, yPosition);
      yPosition += 10;
      
      education.forEach((edu) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        const degree = edu.degree || 'Título no especificado';
        const institution = edu.institution ? ` - ${edu.institution}` : '';
        doc.text(`${degree}${institution}`, 20, yPosition);
        yPosition += 6;
        
        if (edu.startDate || edu.endDate) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 100, 100);
          const dateRange = `${edu.startDate || ''} - ${edu.endDate || 'Presente'}`;
          doc.text(dateRange, 20, yPosition);
          yPosition += 6;
        }
        
        if (edu.description) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          
          const splitDescription = doc.splitTextToSize(edu.description, 170);
          doc.text(splitDescription, 20, yPosition);
          yPosition += splitDescription.length * 5;
        }
        
        yPosition += 8;
      });
    }
    
    // HABILIDADES
    if (skills && skills.length > 0) {
      // Verificar si necesitamos nueva página
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('HABILIDADES', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      // Agrupar habilidades en líneas
      const skillsText = skills.join(' • ');
      const splitSkills = doc.splitTextToSize(skillsText, 170);
      doc.text(splitSkills, 20, yPosition);
      yPosition += splitSkills.length * 5 + 10;
    }
    
    // IDIOMAS
    if (languages && languages.length > 0) {
      // Verificar si necesitamos nueva página
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(16);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('IDIOMAS', 20, yPosition);
      yPosition += 10;
      
      languages.forEach((lang) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        const languageText = `${lang.name}${lang.level ? ` (${lang.level})` : ''}`;
        doc.text(`• ${languageText}`, 20, yPosition);
        yPosition += 6;
      });
    }
    
    // Pie de página
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
      doc.text('Generado por Analizador CV con IA', 105, 290, { align: 'center' });
    }
    
    // Generate PDF as data URL
    const pdfDataUrl = doc.output('datauristring');
    return pdfDataUrl;
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};