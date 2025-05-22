//src/app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/cv/FileUploader';
import { ResultViewer } from '@/components/cv/ResultViewer';
import { useVisionAI } from '@/hooks/useVisionAI';
import { useOpenAI } from '@/hooks/useOpenAI';
import { firestoreService } from '@/services/firestore';
import { CV } from '@/types/cv';
import { Loader } from '@/components/ui/Loader';
import { Navbar } from '@/components/layout/Navbar';

export default function Dashboard() {
  const [cv, setCv] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { extractText, isExtracting } = useVisionAI();
  const { processText, isProcessing } = useOpenAI();

  const handleUploadComplete = async (imageUrl: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Crear un objeto CV inicial
      const initialCV: Omit<CV, 'id' | 'createdAt'> = {
        originalImageUrl: imageUrl,
        extractedText: '',
        processedData: null,
        status: 'extracting'
      };
      
      // Guardar CV inicial en Firestore
      console.log('Guardando CV inicial en Firestore...');
      const firestoreId = await firestoreService.createCV(initialCV);
      
      // Crear CV con ID de Firestore
      const cvWithId: CV = {
        id: firestoreId,
        ...initialCV,
        createdAt: new Date(),
      };
      
      setCv(cvWithId);
      
      // Extraer texto de la imagen usando Google Vision AI
      console.log('Extrayendo texto con Google Vision AI...');
      const { text } = await extractText(imageUrl);
      
      console.log('Texto extraído:', text);
      console.log('Longitud del texto:', text.length);
      
      // Actualizar Firestore con el texto extraído
      await firestoreService.updateExtractedText(firestoreId, text);
      
      // Actualizar el estado local
      const cvWithText: CV = {
        ...cvWithId,
        extractedText: text,
        status: 'processing'
      };
      
      setCv(cvWithText);
      
      // Procesar el texto usando OpenAI
      console.log('Procesando texto con OpenAI...');
      const { processedData } = await processText(text);
      
      // Actualizar Firestore con los datos procesados
      await firestoreService.updateProcessedData(firestoreId, processedData);
      
      // Actualizar el estado local con los datos completados
      const completedCV: CV = {
        ...cvWithText,
        processedData,
        status: 'completed'
      };
      
      setCv(completedCV);
      
      console.log('✅ Proceso completado exitosamente');
      
    } catch (err) {
      console.error('❌ Error en el procesamiento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error en el procesamiento';
      setError(errorMessage);
      
      // Marcar como error en Firestore si tenemos un ID
      if (cv?.id) {
        try {
          await firestoreService.markAsError(cv.id, errorMessage);
        } catch (firestoreError) {
          console.error('Error actualizando estado de error en Firestore:', firestoreError);
        }
        
        // Actualizar estado local
        setCv({
          ...cv,
          status: 'error',
          errorMessage
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-card-foreground flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Analizador de CV con IA
          </h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="card p-6 mb-8 border border-border">
          <div className="md:flex items-center">
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Bienvenido al Analizador de CV</h2>
              <p className="text-secondary-foreground mb-2">Esta aplicación te permite:</p>
              <div className="space-y-1 mb-3">
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">Subir una imagen de un CV</span>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">Extraer el texto automáticamente con Google Vision AI</span>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">Analizar la información con OpenAI</span>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">Guardar en base de datos y generar PDF</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium">Error</p>
            </div>
            <p className="mt-1 ml-7 text-sm">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <FileUploader
              onUploadComplete={handleUploadComplete}
              onError={handleError}
            />
            
            {(isLoading || isExtracting || isProcessing) && (
              <div className="mt-6 card p-6 flex flex-col items-center justify-center text-center">
                <Loader size="md" color="primary" />
                <p className="mt-4 text-secondary-foreground">
                  {isExtracting 
                    ? "Extrayendo texto del documento..." 
                    : isProcessing 
                      ? "Procesando información con IA..." 
                      : "Guardando en base de datos..."}
                </p>
                <div className="w-full bg-secondary h-2 rounded-full mt-4 overflow-hidden">
                  <div className="animate-shimmer h-full rounded-full"></div>
                </div>
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
          <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-400">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium">¡Procesamiento completado y guardado!</p>
            </div>
            <p className="mt-1 ml-7 text-sm">CV guardado en Firestore con ID: {cv.id}</p>
          </div>
        )}
      </main>
      
      <footer className="bg-card border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-secondary-foreground text-sm">
            © {new Date().getFullYear()} Analizador de CV con IA. Desarrollado con Next.js, Firebase y OpenAI.
          </p>
        </div>
      </footer>
    </div>
  );
}