// src/hooks/useAsyncProcessing.ts
import { useState, useEffect, useRef } from 'react';
import { firestoreService } from '@/services/firestore';
import { CV } from '@/types/cv';

interface UseAsyncProcessingOptions {
  pollingInterval?: number; // ms
  maxRetries?: number;
}

export const useAsyncProcessing = (options: UseAsyncProcessingOptions = {}) => {
  const {
    pollingInterval = 2000, // Revisar cada 2 segundos
    maxRetries = 30 // Máximo 1 minuto de espera
  } = options;
  
  const [isPolling, setIsPolling] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Iniciar procesamiento asíncrono
  const startAsyncProcess = async (
    cvId: string,
    onUpdate: (cv: CV) => void,
    onComplete: (cv: CV) => void,
    onError: (error: string) => void
  ) => {
    setIsPolling(true);
    setRetryCount(0);
    
    const checkStatus = async () => {
      try {
        const cv = await firestoreService.getCV(cvId);
        
        if (!cv) {
          throw new Error('CV no encontrado');
        }
        
        // Actualizar UI con el estado actual
        onUpdate(cv);
        
        // Verificar si está completo
        if (cv.status === 'completed' && cv.processedData) {
          stopPolling();
          onComplete(cv);
          return;
        }
        
        // Verificar si hay error
        if (cv.status === 'error') {
          stopPolling();
          onError(cv.errorMessage || 'Error en el procesamiento');
          return;
        }
        
        // Verificar límite de reintentos
        setRetryCount(prev => {
          const newCount = prev + 1;
          if (newCount >= maxRetries) {
            stopPolling();
            onError('Tiempo de espera agotado');
          }
          return newCount;
        });
        
      } catch (error) {
        console.error('Error en polling:', error);
        stopPolling();
        onError('Error al verificar estado');
      }
    };
    
    // Iniciar polling
    intervalRef.current = setInterval(checkStatus, pollingInterval);
    
    // Primera verificación inmediata
    checkStatus();
  };
  
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  };
  
  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);
  
  return {
    startAsyncProcess,
    stopPolling,
    isPolling,
    retryCount
  };
};