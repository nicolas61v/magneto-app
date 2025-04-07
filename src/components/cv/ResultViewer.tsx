// src/components/cv/ResultViewer.tsx
import { useState } from 'react';
import { CV } from '@/types/cv';
import { PdfGenerator } from './PdfGenerator';
import { Button } from '@/components/ui/Button';
import { ResultViewerProps } from '@/types/components';

export const ResultViewer: React.FC<ResultViewerProps> = ({ cv, isLoading }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-6 text-center">Cargando resultados...</div>;
  }

  if (!cv || !cv.processedData) {
    return <div className="p-6 text-center">No hay datos para mostrar</div>;
  }

  const { personalInfo, education, experience, skills, summary } = cv.processedData;

  const handlePdfGenerated = (url: string) => {
    setPdfUrl(url);
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Información Extraída</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Información Personal</h3>
          <p><strong>Nombre:</strong> {personalInfo.name}</p>
          <p><strong>Email:</strong> {personalInfo.email}</p>
          {personalInfo.phone && <p><strong>Teléfono:</strong> {personalInfo.phone}</p>}
          {personalInfo.location && <p><strong>Ubicación:</strong> {personalInfo.location}</p>}
        </div>

        <div>
          <h3 className="text-lg font-medium">Resumen</h3>
          <p>{summary}</p>
        </div>

        <div>
          <h3 className="text-lg font-medium">Experiencia</h3>
          <ul className="list-disc pl-5">
            {experience.map((exp, idx: number) => (
              <li key={idx}>
                <p><strong>{exp.position}</strong> en {exp.company}</p>
                {(exp.startDate || exp.endDate) && (
                  <p className="text-sm text-gray-600">
                    {exp.startDate} - {exp.endDate || 'Actual'}
                  </p>
                )}
                {exp.description && <p>{exp.description}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-medium">Educación</h3>
          <ul className="list-disc pl-5">
            {education.map((edu, idx: number) => (
              <li key={idx}>
                <p><strong>{edu.degree}</strong> en {edu.institution}</p>
                {(edu.startDate || edu.endDate) && (
                  <p className="text-sm text-gray-600">
                    {edu.startDate} - {edu.endDate || 'Actual'}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-medium">Habilidades</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <PdfGenerator cvData={cv.processedData} onGenerate={handlePdfGenerated} />
          
          {pdfUrl && (
            <a 
              href={pdfUrl} 
              download="cv_resumen.pdf"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Descargar PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
};