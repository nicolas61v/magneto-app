//src/app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/cv/FileUploader';
import { ResultViewer } from '@/components/cv/ResultViewer';
import { useAsyncProcessing } from '@/hooks/useAsyncProcessing';
import { firestoreService } from '@/services/firestore';
import { CV } from '@/types/cv';
import { Loader } from '@/components/ui/Loader';
import { Navbar } from '@/components/layout/Navbar';

export default function Dashboard() {
  const [cv, setCv] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProgress, setCurrentProgress] = useState<string>('');
  const { startAsyncProcess, isPolling } = useAsyncProcessing();

  const handleUploadComplete = async (imageUrls: string | string[]) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Convertir a array si es string único
      const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      
      setCurrentProgress(`Preparando ${urls.length} imagen${urls.length > 1 ? 'es' : ''}...`);
      
      // Crear CV inicial
      const initialCV: Omit<CV, 'id' | 'createdAt'> = {
        originalImageUrl: urls[0],
        additionalImageUrls: urls.slice(1),
        extractedText: '',
        processedData: null,
        status: 'uploading',
        extractionProgress: 0
      };
      
      // Guardar en Firestore
      const firestoreId = await firestoreService.createCV(initialCV);
      
      const cvWithId: CV = {
        id: firestoreId,
        ...initialCV,
        createdAt: new Date(),
      };
      
      setCv(cvWithId);
      
      // Iniciar procesamiento asíncrono
      setCurrentProgress('Iniciando procesamiento...');
      
      const response = await fetch('/api/process-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvId: firestoreId,
          imageUrls: urls
        })
      });
      
      if (!response.ok) {
        throw new Error('Error iniciando procesamiento');
      }
      
      setIsLoading(false);
      
      // Iniciar polling para verificar estado
      startAsyncProcess(
        firestoreId,
        (updatedCv) => {
          setCv(updatedCv);
          
          // Actualizar mensaje de progreso
          if (updatedCv.status === 'extracting') {
            const progress = updatedCv.extractionProgress || 0;
            if (progress < 50) {
              setCurrentProgress(`Extrayendo texto: ${Math.round(progress * 2)}%`);
            } else {
              setCurrentProgress('Analizando con IA...');
            }
          } else if (updatedCv.status === 'processing') {
            setCurrentProgress('Finalizando análisis con IA...');
          }
        },
        (completedCv) => {
          setCv(completedCv);
          setCurrentProgress('');
        },
        (errorMsg) => {
          setError(errorMsg);
          setCurrentProgress('');
        }
      );
      
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error en el procesamiento';
      setError(errorMessage);
      setCurrentProgress('');
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
                  <span className="text-sm">Subir CVs en formato PDF o imagen</span>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">Conversión automática de PDFs a imágenes</span>
                </div>
                <div className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm">Procesamiento asíncrono sin timeouts</span>
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
              <div className="bg-blue-50 text-blue-700 p-2 rounded text-sm">
                💡 <strong>Tip:</strong> Los PDFs con imágenes escaneadas también funcionan perfectamente
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
            
            {(isLoading || isPolling) && currentProgress && (
              <div className="mt-6 card p-6 flex flex-col items-center justify-center text-center">
                <Loader size="md" color="primary" />
                <p className="mt-4 text-secondary-foreground">
                  {currentProgress}
                </p>
                <div className="w-full bg-secondary h-2 rounded-full mt-4 overflow-hidden">
                  <div className="animate-shimmer h-full rounded-full"></div>
                </div>
                {isPolling && (
                  <p className="text-xs text-gray-500 mt-2">
                    Procesando en segundo plano...
                  </p>
                )}
              </div>
            )}
          </div>
          
          {cv && (
            <div>
              <ResultViewer
                cv={cv}
                isLoading={isLoading || isPolling}
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
            <p className="mt-1 ml-7 text-sm">
              CV guardado en Firestore con ID: {cv.id}
              {cv.additionalImageUrls && cv.additionalImageUrls.length > 0 && 
                ` (${cv.additionalImageUrls.length + 1} páginas procesadas)`
              }
            </p>
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