// src/hooks/useStepProcessing.ts
import { useState } from 'react';
import { firestoreService } from '@/services/firestore';
import { CV } from '@/types/cv';

interface UseStepProcessingOptions {
  onUpdate?: (cv: CV) => void;
  onComplete?: (cv: CV) => void;
  onError?: (error: string) => void;
}

// src/hooks/useStepProcessing.ts - REEMPLAZAR SECCIÓN COMPLETA

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
      // ✅ PASO 1: Extraer texto de cada imagen
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
            console.error(`Error HTTP ${response.status} para imagen ${i + 1}`);
            // ✅ INTENTAR LEER ERROR COMO TEXTO PRIMERO
            let errorMessage = 'Error en extracción';
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch {
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
          }
          
          const { extractedText, progress: extractionProgress } = await response.json();
          
          if (extractedText && extractedText.trim().length > 0) {
            if (allExtractedText.length > 0) {
              allExtractedText += '\n\n--- PÁGINA ' + (i + 1) + ' ---\n\n';
            }
            allExtractedText += extractedText;
          }
          
          setProgress(extractionProgress);
          
          // ✅ ACTUALIZAR CV EN TIEMPO REAL
          if (onUpdate) {
            const updatedCV = await firestoreService.getCV(cvId);
            if (updatedCV) onUpdate(updatedCV);
          }
          
        } catch (error) {
          console.error(`Error procesando imagen ${i + 1}:`, error);
          // ✅ CONTINUAR CON OTRAS IMÁGENES EN LUGAR DE FALLAR
          if (i === 0) {
            // Si falla la primera imagen, es crítico
            throw error;
          }
          // Si falla una imagen posterior, continuar
        }
      }
      
      // ✅ VALIDAR QUE TENEMOS TEXTO SUFICIENTE
      if (!allExtractedText || allExtractedText.trim().length < 50) {
        throw new Error('No se pudo extraer texto suficiente de las imágenes');
      }
      
      // ✅ PASO 2: Analizar con OpenAI (CON MEJOR MANEJO DE ERRORES)
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
        let errorMessage = `Error HTTP ${analysisResponse.status} - Servidor sobrecargado. Intenta con una sola imagen.`;
        throw new Error(errorMessage);
      }

      // ✅ PARSEAR RESPUESTA CON VALIDACIÓN
      let analysisData;
      try {
        analysisData = await analysisResponse.json();
      } catch (jsonError) {
        console.error('Error parsing analysis response:', jsonError);
        throw new Error('Respuesta inválida del servidor de análisis');
      }
      
      setProgress(100);
      setCurrentStep('¡Procesamiento completado!');
      
      // ✅ OBTENER CV ACTUALIZADO FINAL
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
      
      // ✅ MARCAR COMO ERROR EN FIRESTORE
      try {
        await firestoreService.markAsError(cvId, errorMessage);
      } catch (firestoreError) {
        console.error('Error guardando error en Firestore:', firestoreError);
      }
      
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