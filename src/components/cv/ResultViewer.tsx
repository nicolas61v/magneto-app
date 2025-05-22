// src/components/cv/ResultViewer.tsx
import { useState } from 'react';
import { PdfGenerator } from './PdfGenerator';
import { ResultViewerProps } from '@/types/components';

export const ResultViewer: React.FC<ResultViewerProps> = ({ cv, isLoading }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showImages, setShowImages] = useState(false);

  if (isLoading) {
    return <div className="p-6 text-center">Cargando resultados...</div>;
  }

  if (!cv || !cv.processedData) {
    return <div className="p-6 text-center">No hay datos para mostrar</div>;
  }

  const { personalInfo, education, experience, skills, summary, languages } = cv.processedData;
  const totalImages = 1 + (cv.additionalImageUrls?.length || 0);

  const handlePdfGenerated = (url: string) => {
    setPdfUrl(url);
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Información Extraída
        </h2>
        
        {totalImages > 1 && (
          <button
            onClick={() => setShowImages(!showImages)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {showImages ? 'Ocultar' : 'Ver'} {totalImages} imágenes
          </button>
        )}
      </div>

      {/* Vista de imágenes */}
      {showImages && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Imágenes procesadas:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="relative group">
              <img 
                src={cv.originalImageUrl} 
                alt="CV Página 1" 
                className="w-full h-40 object-cover rounded border border-gray-300 cursor-pointer hover:border-blue-500"
                onClick={() => window.open(cv.originalImageUrl, '_blank')}
              />
              <span className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                Página 1
              </span>
            </div>
            
            {cv.additionalImageUrls?.map((url, index) => (
              <div key={index} className="relative group">
                <img 
                  src={url} 
                  alt={`CV Página ${index + 2}`} 
                  className="w-full h-40 object-cover rounded border border-gray-300 cursor-pointer hover:border-blue-500"
                  onClick={() => window.open(url, '_blank')}
                />
                <span className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  Página {index + 2}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Información Personal */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Información Personal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <p><strong>Nombre:</strong> {personalInfo.name || 'No proporcionado'}</p>
            <p><strong>Email:</strong> {personalInfo.email && personalInfo.email !== 'null' ? personalInfo.email : 'No proporcionado'}</p>
            {personalInfo.phone && <p><strong>Teléfono:</strong> {personalInfo.phone}</p>}
            {personalInfo.location && <p><strong>Ubicación:</strong> {personalInfo.location}</p>}
          </div>
        </div>

        {/* Resumen */}
        {summary && summary.trim() !== '' && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Resumen
            </h3>
            <p className="text-gray-700">{summary}</p>
          </div>
        )}

        {/* Experiencia */}
        {experience && experience.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 112 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
              </svg>
              Experiencia ({experience.length})
            </h3>
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div key={idx} className="border-l-4 border-green-500 pl-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="font-semibold text-gray-900">
                      {exp.position || 'Puesto no especificado'}
                    </h4>
                    {exp.company && <span className="text-gray-600">{exp.company}</span>}
                  </div>
                  {(exp.startDate || exp.endDate) && (
                    <p className="text-sm text-gray-500 mt-1">
                      {exp.startDate || ''} - {exp.endDate || 'Actual'}
                    </p>
                  )}
                  {exp.description && <p className="text-gray-700 mt-2">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educación */}
        {education && education.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Educación ({education.length})
            </h3>
            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={idx} className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900">
                    {edu.degree || 'Título no especificado'}
                  </h4>
                  {edu.institution && <p className="text-gray-600">{edu.institution}</p>}
                  {(edu.startDate || edu.endDate) && (
                    <p className="text-sm text-gray-500">
                      {edu.startDate || ''} - {edu.endDate || 'Actual'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Habilidades */}
        {skills && skills.length > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Habilidades ({skills.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Idiomas */}
        {languages && languages.length > 0 && (
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Idiomas ({languages.length})
            </h3>
            <div className="space-y-2">
              {languages.map((lang, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="font-medium">{lang.name}</span>
                  {lang.level && <span className="text-sm text-gray-600 bg-indigo-100 px-2 py-1 rounded">{lang.level}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-4 mt-6 pt-6 border-t">
          <PdfGenerator cvData={cv.processedData} onGenerate={handlePdfGenerated} />
          
          {pdfUrl && (
            <a 
              href={pdfUrl} 
              download={`cv_${personalInfo.name?.replace(/\s+/g, '_').toLowerCase() || 'resumen'}.pdf`}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
};