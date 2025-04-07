//src/app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/cv/FileUploader';
import { ResultViewer } from '@/components/cv/ResultViewer';
import { useVisionAI } from '@/hooks/useVisionAI';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { CV } from '@/types/cv';
import { Loader } from '@/components/ui/Loader';
import { Navbar } from '@/components/layout/Navbar';

export default function Dashboard() {
  const [cv, setCv] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { extractText, isExtracting } = useVisionAI();
  const { processText, isProcessing } = useGeminiAI();

  const handleUploadComplete = async (imageUrl: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Crear un objeto CV inicial
      const initialCV: CV = {
        id: Date.now().toString(),
        originalImageUrl: imageUrl,
        extractedText: '',
        processedData: null,
        createdAt: new Date(),
        status: 'extracting'
      };
      
      setCv(initialCV);
      
      // Extraer texto de la imagen usando Google Vision AI
      const { text } = await extractText(imageUrl);
      
      // Actualizar el estado del CV con el texto extraído
      const cvWithText: CV = {
        ...initialCV,
        extractedText: text,
        status: 'processing'
      };
      
      setCv(cvWithText);
      
      // Procesar el texto usando Google AI Studio (Gemini)
      const { processedData } = await processText(text);
      
      // Actualizar el estado del CV con los datos procesados
      const completedCV: CV = {
        ...cvWithText,
        processedData,
        status: 'completed'
      };
      
      setCv(completedCV);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el procesamiento');
      
      // Actualizar el estado del CV con el error
      if (cv) {
        setCv({
          ...cv,
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Error desconocido'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Analizador de CV con IA</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Bienvenido al Analizador de CV</h2>
          <p className="text-gray-600 mb-2">Esta aplicación te permite:</p>
          <ul className="list-disc pl-5 mb-4 text-gray-600">
            <li>Subir una imagen de un CV</li>
            <li>Extraer el texto automáticamente con Google Vision AI</li>
            <li>Analizar la información con Google AI Studio</li>
            <li>Generar un resumen estructurado en formato PDF</li>
          </ul>
          <p className="text-gray-600">Comienza subiendo un documento a continuación.</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <FileUploader
              onUploadComplete={handleUploadComplete}
              onError={handleError}
            />
            
            {(isLoading || isExtracting || isProcessing) && (
              <div className="mt-6 p-6 border rounded-lg bg-white shadow-sm text-center">
                <Loader size="md" color="primary" />
                <p className="mt-4 text-gray-600">
                  {isExtracting 
                    ? "Extrayendo texto del documento..." 
                    : isProcessing 
                      ? "Procesando información con IA..." 
                      : "Procesando..."}
                </p>
              </div>
            )}
          </div>
          
          {cv && (
            <div>
              <ResultViewer
                cv={cv}
                isLoading={isLoading || isExtracting || isProcessing}
              />
            </div>
          )}
        </div>
        
        {cv?.processedData && (
          <div className="mt-8 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-700">
              ¡Procesamiento completado con éxito! Puedes generar un PDF con la información extraída.
            </p>
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Analizador de CV con IA. Desarrollado con Next.js, Firebase y Google AI.
          </p>
        </div>
      </footer>
    </div>
  );
}