import { CVData } from '@/types/cv';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Typescript declaration for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }
}

// Definir interfaz para las opciones de autoTable
interface AutoTableOptions {
  head?: Array<Array<string>>;
  body?: Array<Array<string | number>>;
  startY?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  theme?: string;
  styles?: object;
  headStyles?: object;
  bodyStyles?: object;
  // Puedes añadir más propiedades según lo que necesites
}

export const generatePdf = async (cvData: CVData): Promise<string> => {
  try {
    const { personalInfo, education, experience, skills, summary } = cvData;
    
    // Create new PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Currículum Vitae', 105, 15, { align: 'center' });
    
    // Add personal info
    doc.setFontSize(16);
    doc.text('Información Personal', 14, 25);
    doc.setFontSize(12);
    doc.text(`Nombre: ${personalInfo.name}`, 14, 35);
    doc.text(`Email: ${personalInfo.email}`, 14, 42);
    if (personalInfo.phone) doc.text(`Teléfono: ${personalInfo.phone}`, 14, 49);
    if (personalInfo.location) doc.text(`Ubicación: ${personalInfo.location}`, 14, 56);
    
    // Add summary
    doc.setFontSize(16);
    doc.text('Resumen', 14, 70);
    doc.setFontSize(12);
    
    // Split summary into multiple lines if needed
    const splitSummary = doc.splitTextToSize(summary, 180);
    doc.text(splitSummary, 14, 80);
    
    let yPosition = 80 + splitSummary.length * 7;
    
    // Add experience
    doc.setFontSize(16);
    doc.text('Experiencia', 14, yPosition + 10);
    yPosition += 20;
    
    experience.forEach(exp => {
      doc.setFontSize(12);
      // Corrección: usar 'helvetica' o simplemente el string para el estilo
      doc.setFont('helvetica', 'bold');
      doc.text(`${exp.position} en ${exp.company}`, 14, yPosition);
      doc.setFont('helvetica', 'normal');
      
      if (exp.startDate || exp.endDate) {
        yPosition += 7;
        doc.text(`${exp.startDate || ''} - ${exp.endDate || 'Actual'}`, 14, yPosition);
      }
      
      if (exp.description) {
        yPosition += 7;
        const splitDescription = doc.splitTextToSize(exp.description, 180);
        doc.text(splitDescription, 14, yPosition);
        yPosition += splitDescription.length * 7;
      }
      
      yPosition += 10;
    });
    
    // Add education
    doc.setFontSize(16);
    doc.text('Educación', 14, yPosition);
    yPosition += 10;
    
    education.forEach(edu => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${edu.degree} en ${edu.institution}`, 14, yPosition);
      doc.setFont('helvetica', 'normal');
      
      if (edu.startDate || edu.endDate) {
        yPosition += 7;
        doc.text(`${edu.startDate || ''} - ${edu.endDate || 'Actual'}`, 14, yPosition);
      }
      
      yPosition += 10;
    });
    
    // Add skills
    doc.setFontSize(16);
    doc.text('Habilidades', 14, yPosition);
    yPosition += 10;
    
    const skillsText = skills.join(', ');
    const splitSkills = doc.splitTextToSize(skillsText, 180);
    doc.setFontSize(12);
    doc.text(splitSkills, 14, yPosition);
    
    // Generate PDF as data URL
    const pdfDataUrl = doc.output('datauristring');
    return pdfDataUrl;
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};