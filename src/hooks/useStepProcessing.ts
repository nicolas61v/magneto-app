// src/hooks/useStepProcessing.ts
import { useState } from 'react';
import { firestoreService } from '@/services/firestore';
import { CV } from '@/types/cv';

interface UseStepProcessingOptions {
  onUpdate?: (cv: CV) => void;
  onComplete?: (cv: CV) => void;
  onError?: (error: string) => void;
}

export const useStepProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  
  const processCV = async (
    cvId: string,
    imageUrls: string[],
    options: UseStepProcessingOptions = {}
  ) => {
    const { onUpdate, onComplete, onError } = options;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // PASO 1: Extraer texto de cada imagen
      let allExtractedText = '';
      const totalImages = imageUrls.length;
      
      for (let i = 0; i < imageUrls.length; i++) {
        setCurrentStep(`Extrayendo texto de imagen ${i + 1} de ${totalImages}...`);
        
        try {
          const response = await fetch('/api/process-step1-extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cvId,
              imageUrl: imageUrls[i],
              pageNumber: i + 1,
              totalPages: totalImages
            })
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error en extracción');
          }
          
          const { extractedText, progress: extractionProgress } = await response.json();
          
          if (extractedText && extractedText.trim().length > 0) {
            if (allExtractedText.length > 0) {
              allExtractedText += '\n\n--- PÁGINA ' + (i + 1) + ' ---\n\n';
            }
            allExtractedText += extractedText;
          }
          
          setProgress(extractionProgress);
          
          // Actualizar CV en tiempo real
          if (onUpdate) {
            const updatedCV = await firestoreService.getCV(cvId);
            if (updatedCV) onUpdate(updatedCV);
          }
          
        } catch (error) {
          console.error(`Error procesando imagen ${i + 1}:`, error);
          // Continuar con las demás imágenes
        }
      }
      
      // Validar que tenemos texto suficiente
      if (!allExtractedText || allExtractedText.trim().length < 50) {
        throw new Error('No se pudo extraer texto suficiente de las imágenes');
      }
      
      // PASO 2: Analizar con OpenAI
      setCurrentStep('Analizando información con IA...');
      setProgress(60);
      
      const analysisResponse = await fetch('/api/process-step2-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvId,
          allExtractedText
        })
      });
      
      if (!analysisResponse.ok) {
        const error = await analysisResponse.json();
        throw new Error(error.error || 'Error en análisis');
      }
      
    //   const { processedData } = await analysisResponse.json();
      
      setProgress(100);
      setCurrentStep('¡Procesamiento completado!');
      
      // Obtener CV actualizado final
      const finalCV = await firestoreService.getCV(cvId);
      if (finalCV && onComplete) {
        onComplete(finalCV);
      }
      
    } catch (error) {
      console.error('Error en procesamiento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error en procesamiento';
      
      if (onError) {
        onError(errorMessage);
      }
      
      // Marcar como error en Firestore
      await firestoreService.markAsError(cvId, errorMessage);
      
    } finally {
      setIsProcessing(false);
    }
  };
  
  return {
    processCV,
    isProcessing,
    currentStep,
    progress
  };
};